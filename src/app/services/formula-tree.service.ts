import { Injectable } from '@angular/core';
import { FormulaNode, EvaluationContext, EvaluationResult, NodeRegistry } from '../models/formula-node.model';

@Injectable({
  providedIn: 'root'
})
export class FormulaTreeService {
  private registry: NodeRegistry = {
    nodes: new Map<string, FormulaNode>(),
    rootNodeIds: []
  };

  /**
   * Gets the current node registry
   */
  getRegistry(): NodeRegistry {
    return this.registry;
  }

  /**
   * Gets a node by ID from the registry
   */
  getNode(nodeId: string): FormulaNode | undefined {
    return this.registry.nodes.get(nodeId);
  }

  /**
   * Gets all nodes that are used as roots (not referenced by any parent)
   */
  getRootNodes(): FormulaNode[] {
    return this.registry.rootNodeIds
      .map(id => this.registry.nodes.get(id))
      .filter(node => node !== undefined) as FormulaNode[];
  }

  /**
   * Gets all nodes in the registry
   */
  getAllNodes(): FormulaNode[] {
    return Array.from(this.registry.nodes.values());
  }

  /**
   * Clears the registry
   */
  clearRegistry(): void {
    this.registry.nodes.clear();
    this.registry.rootNodeIds = [];
  }
  
  /**
   * Creates a new factor node with a direct value
   */
  createFactorNode(name: string, value: number, description?: string, unit?: string): FormulaNode {
    const node: FormulaNode = {
      id: this.generateId(),
      name,
      type: 'factor',
      value,
      childrenIds: [],
      computedValue: value,
      description,
      unit,
      parentIds: []
    };
    this.registry.nodes.set(node.id, node);
    return node;
  }

  /**
   * Creates a new formula node that computes from child factors
   * @param childNodeIds - Array of node IDs to use as children
   */
  createFormulaNode(name: string, formula: string, childNodeIds: string[], description?: string, unit?: string): FormulaNode {
    const node: FormulaNode = {
      id: this.generateId(),
      name,
      type: 'formula',
      formula,
      childrenIds: childNodeIds,
      description,
      unit,
      parentIds: []
    };
    
    // Register parent reference in all children
    for (const childId of childNodeIds) {
      const child = this.registry.nodes.get(childId);
      if (child) {
        if (!child.parentIds) {
          child.parentIds = [];
        }
        child.parentIds.push(node.id);
      }
    }
    
    this.registry.nodes.set(node.id, node);
    this.evaluateNode(node.id);
    return node;
  }

  /**
   * Marks a node as a root node (top-level formula to display)
   */
  addRootNode(nodeId: string): void {
    if (!this.registry.rootNodeIds.includes(nodeId)) {
      this.registry.rootNodeIds.push(nodeId);
    }
  }

  /**
   * Removes a node from root nodes
   */
  removeRootNode(nodeId: string): void {
    const index = this.registry.rootNodeIds.indexOf(nodeId);
    if (index !== -1) {
      this.registry.rootNodeIds.splice(index, 1);
    }
  }

  /**
   * Evaluates a single node's formula using its children from the registry
   */
  evaluateNode(nodeId: string, visitedNodes: Set<string> = new Set()): EvaluationResult {
    const node = this.registry.nodes.get(nodeId);
    if (!node) {
      return { success: false, error: 'Node not found' };
    }

    // Prevent infinite loops from circular dependencies
    if (visitedNodes.has(nodeId)) {
      console.warn(`Circular dependency detected at node: ${node.name}`);
      return { success: false, error: 'Circular dependency detected' };
    }

    visitedNodes.add(nodeId);

    if (node.type === 'factor') {
      node.computedValue = node.value ?? 0;
      return { success: true, value: node.computedValue };
    }

    if (!node.formula) {
      return { success: false, error: 'No formula defined' };
    }

    // Build evaluation context from children
    const context: EvaluationContext = {};
    for (const childId of node.childrenIds) {
      const child = this.registry.nodes.get(childId);
      if (child) {
        // Recursively evaluate children first, passing visited nodes
        this.evaluateNode(childId, new Set(visitedNodes));
        context[child.name] = child.computedValue ?? 0;
      }
    }

    // Evaluate the formula
    const result = this.evaluateFormula(node.formula, context);
    if (result.success && result.value !== undefined) {
      node.computedValue = result.value;
    }
    
    return result;
  }

  /**
   * Recursively evaluates the entire tree starting from a root node
   */
  evaluateTree(nodeId: string): void {
    this.evaluateNode(nodeId, new Set());
  }

  /**
   * Re-evaluates all root nodes in the registry
   */
  evaluateAllRoots(): void {
    for (const rootId of this.registry.rootNodeIds) {
      this.evaluateNode(rootId, new Set());
    }
  }

  /**
   * Evaluates a formula string with given context
   * Supports basic arithmetic: +, -, *, /, (), and variable names
   */
  evaluateFormula(formula: string, context: EvaluationContext): EvaluationResult {
    try {
      // Replace variable names with their values
      let expression = formula;
      for (const [key, value] of Object.entries(context)) {
        // Use word boundaries to avoid partial matches
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(regex, value.toString());
      }

      // Safely evaluate the expression (basic approach - consider a proper parser for production)
      // This uses Function constructor which is safer than eval but still needs sanitization
      const result = this.safeEvaluate(expression);
      
      if (typeof result === 'number' && !isNaN(result)) {
        return { success: true, value: result };
      } else {
        return { success: false, error: 'Formula evaluation resulted in non-numeric value' };
      }
    } catch (error) {
      return { success: false, error: `Formula evaluation error: ${error}` };
    }
  }

  /**
   * Safely evaluates a mathematical expression
   * Only allows numbers and basic operators
   */
  private safeEvaluate(expression: string): number {
    // Remove whitespace
    const cleaned = expression.replace(/\s/g, '');
    
    // Validate that expression only contains allowed characters
    if (!/^[0-9+\-*/().]+$/.test(cleaned)) {
      throw new Error('Invalid characters in expression');
    }

    // Use Function constructor (safer than eval)
    const func = new Function(`return ${cleaned}`);
    return func();
  }

  /**
   * Adds a child node reference to a parent
   */
  addChild(parentId: string, childId: string): void {
    const parent = this.registry.nodes.get(parentId);
    const child = this.registry.nodes.get(childId);
    
    if (!parent || !child) {
      return;
    }

    if (!parent.childrenIds.includes(childId)) {
      parent.childrenIds.push(childId);
      
      // Update parent reference in child
      if (!child.parentIds) {
        child.parentIds = [];
      }
      if (!child.parentIds.includes(parentId)) {
        child.parentIds.push(parentId);
      }
      
      if (parent.type === 'formula') {
        this.evaluateNode(parentId, new Set());
      }
    }
  }

  /**
   * Removes a child node reference from parent
   */
  removeChild(parentId: string, childId: string): boolean {
    const parent = this.registry.nodes.get(parentId);
    const child = this.registry.nodes.get(childId);
    
    if (!parent || !child) {
      return false;
    }

    const index = parent.childrenIds.indexOf(childId);
    if (index !== -1) {
      parent.childrenIds.splice(index, 1);
      
      // Update parent reference in child
      if (child.parentIds) {
        const parentIndex = child.parentIds.indexOf(parentId);
        if (parentIndex !== -1) {
          child.parentIds.splice(parentIndex, 1);
        }
      }
      
      if (parent.type === 'formula') {
        this.evaluateNode(parentId, new Set());
      }
      return true;
    }
    return false;
  }

  /**
   * Updates a node's value or formula and re-evaluates
   */
  updateNode(nodeId: string, updates: Partial<FormulaNode>): void {
    const node = this.registry.nodes.get(nodeId);
    if (!node) {
      return;
    }

    Object.assign(node, updates);
    
    if (node.type === 'factor' && updates.value !== undefined) {
      node.computedValue = updates.value;
      // Re-evaluate all root nodes to propagate changes
      this.evaluateAllRoots();
    } else if (node.type === 'formula') {
      this.evaluateNode(nodeId, new Set());
    }
  }

  /**
   * Computes the value of a child node given a desired parent value
   * Uses numerical solving to find the child value that makes the parent formula equal to targetValue
   * 
   * @param parentId - The ID of the parent formula node
   * @param childId - The ID of the child node to solve for
   * @param targetValue - The desired value for the parent node
   * @returns Result object with success status and computed child value
   */
  computeChildValue(
    parentId: string, 
    childId: string, 
    targetValue: number
  ): { success: boolean; value?: number; error?: string } {
    const parent = this.registry.nodes.get(parentId);
    const child = this.registry.nodes.get(childId);

    if (!parent) {
      return { success: false, error: 'Parent node not found' };
    }

    if (!child) {
      return { success: false, error: 'Child node not found' };
    }

    if (parent.type !== 'formula') {
      return { success: false, error: 'Parent must be a formula node' };
    }

    if (!parent.childrenIds.includes(childId)) {
      return { success: false, error: 'Child is not part of parent formula' };
    }

    if (!parent.formula) {
      return { success: false, error: 'Parent has no formula' };
    }

    // Store original child value for restoration if needed
    const originalChildValue = child.type === 'factor' ? child.value : child.computedValue;

    // Build context with all children except the target child
    const buildContext = (childValue: number): EvaluationContext => {
      const context: EvaluationContext = {};
      for (const cId of parent.childrenIds) {
        const c = this.registry.nodes.get(cId);
        if (c) {
          if (cId === childId) {
            context[c.name] = childValue;
          } else {
            context[c.name] = c.computedValue ?? 0;
          }
        }
      }
      return context;
    };

    // Function to evaluate parent with a given child value
    const evaluateWithChildValue = (childValue: number): number => {
      const context = buildContext(childValue);
      const result = this.evaluateFormula(parent.formula!, context);
      return result.success && result.value !== undefined ? result.value : NaN;
    };

    // Try to solve algebraically for simple cases first
    const algebraicSolution = this.trySolveAlgebraically(parent, child, targetValue);
    if (algebraicSolution.success && algebraicSolution.value !== undefined) {
      return algebraicSolution;
    }

    // Use numerical method (Newton's method / bisection) for complex formulas
    const numericalSolution = this.solveNumerically(evaluateWithChildValue, targetValue, originalChildValue ?? 0);
    
    return numericalSolution;
  }

  /**
   * Attempts to solve the formula algebraically for simple cases
   */
  private trySolveAlgebraically(
    parent: FormulaNode,
    child: FormulaNode,
    targetValue: number
  ): { success: boolean; value?: number; error?: string } {
    const formula = parent.formula!;
    const childName = child.name;

    // Build context with current values for other children
    const context: EvaluationContext = {};
    for (const cId of parent.childrenIds) {
      const c = this.registry.nodes.get(cId);
      if (c && c.id !== child.id) {
        context[c.name] = c.computedValue ?? 0;
      }
    }

    // Try to detect simple patterns and solve algebraically
    // Pattern 1: childName * something or something * childName
    const multiplyPattern1 = new RegExp(`^${childName}\\s*\\*\\s*(.+)$`);
    const multiplyPattern2 = new RegExp(`^(.+)\\s*\\*\\s*${childName}$`);
    
    let match = formula.match(multiplyPattern1) || formula.match(multiplyPattern2);
    if (match) {
      const otherPart = match[1];
      const otherValue = this.evaluateFormula(otherPart, context);
      if (otherValue.success && otherValue.value !== undefined && otherValue.value !== 0) {
        return { success: true, value: targetValue / otherValue.value };
      }
    }

    // Pattern 2: childName + something or something + childName
    const addPattern1 = new RegExp(`^${childName}\\s*\\+\\s*(.+)$`);
    const addPattern2 = new RegExp(`^(.+)\\s*\\+\\s*${childName}$`);
    
    match = formula.match(addPattern1) || formula.match(addPattern2);
    if (match) {
      const otherPart = match[1];
      const otherValue = this.evaluateFormula(otherPart, context);
      if (otherValue.success && otherValue.value !== undefined) {
        return { success: true, value: targetValue - otherValue.value };
      }
    }

    // Pattern 3: childName - something
    const subtractPattern1 = new RegExp(`^${childName}\\s*-\\s*(.+)$`);
    match = formula.match(subtractPattern1);
    if (match) {
      const otherPart = match[1];
      const otherValue = this.evaluateFormula(otherPart, context);
      if (otherValue.success && otherValue.value !== undefined) {
        return { success: true, value: targetValue + otherValue.value };
      }
    }

    // Pattern 4: something - childName
    const subtractPattern2 = new RegExp(`^(.+)\\s*-\\s*${childName}$`);
    match = formula.match(subtractPattern2);
    if (match) {
      const otherPart = match[1];
      const otherValue = this.evaluateFormula(otherPart, context);
      if (otherValue.success && otherValue.value !== undefined) {
        return { success: true, value: otherValue.value - targetValue };
      }
    }

    // Pattern 5: childName / something
    const dividePattern1 = new RegExp(`^${childName}\\s*/\\s*(.+)$`);
    match = formula.match(dividePattern1);
    if (match) {
      const otherPart = match[1];
      const otherValue = this.evaluateFormula(otherPart, context);
      if (otherValue.success && otherValue.value !== undefined && otherValue.value !== 0) {
        return { success: true, value: targetValue * otherValue.value };
      }
    }

    // Pattern 6: something / childName
    const dividePattern2 = new RegExp(`^(.+)\\s*/\\s*${childName}$`);
    match = formula.match(dividePattern2);
    if (match) {
      const otherPart = match[1];
      const otherValue = this.evaluateFormula(otherPart, context);
      if (otherValue.success && otherValue.value !== undefined && targetValue !== 0) {
        return { success: true, value: otherValue.value / targetValue };
      }
    }

    return { success: false, error: 'Cannot solve algebraically, will use numerical method' };
  }

  /**
   * Solves for child value using numerical method (secant method)
   */
  private solveNumerically(
    evaluateFunc: (childValue: number) => number,
    targetValue: number,
    initialGuess: number
  ): { success: boolean; value?: number; error?: string } {
    const maxIterations = 100;
    const tolerance = 1e-6;

    // Start with two initial guesses
    let x0 = initialGuess;
    let x1 = initialGuess === 0 ? 1 : initialGuess * 1.1;

    let f0 = evaluateFunc(x0) - targetValue;
    let f1 = evaluateFunc(x1) - targetValue;

    for (let i = 0; i < maxIterations; i++) {
      if (Math.abs(f1) < tolerance) {
        return { success: true, value: x1 };
      }

      if (Math.abs(f1 - f0) < 1e-12) {
        // Derivative too small, try perturbing
        x1 = x1 + (Math.random() - 0.5) * Math.abs(x1) * 0.1;
        f1 = evaluateFunc(x1) - targetValue;
        continue;
      }

      // Secant method: x_next = x1 - f1 * (x1 - x0) / (f1 - f0)
      const xNext = x1 - f1 * (x1 - x0) / (f1 - f0);
      
      if (!isFinite(xNext)) {
        return { success: false, error: 'Numerical solution diverged' };
      }

      x0 = x1;
      f0 = f1;
      x1 = xNext;
      f1 = evaluateFunc(x1) - targetValue;

      if (isNaN(f1)) {
        return { success: false, error: 'Formula evaluation resulted in NaN' };
      }
    }

    // Check if we got close enough
    if (Math.abs(f1) < tolerance * 10) {
      return { success: true, value: x1 };
    }

    return { success: false, error: 'Could not converge to a solution within tolerance' };
  }

  /**
   * Deletes a node from the registry
   */
  deleteNode(nodeId: string): void {
    const node = this.registry.nodes.get(nodeId);
    if (!node) {
      return;
    }

    // Remove from all parents
    if (node.parentIds) {
      for (const parentId of node.parentIds) {
        this.removeChild(parentId, nodeId);
      }
    }

    // Remove parent references from all children
    for (const childId of node.childrenIds) {
      const child = this.registry.nodes.get(childId);
      if (child && child.parentIds) {
        const index = child.parentIds.indexOf(nodeId);
        if (index !== -1) {
          child.parentIds.splice(index, 1);
        }
      }
    }

    // Remove from root nodes if present
    this.removeRootNode(nodeId);

    // Delete from registry
    this.registry.nodes.delete(nodeId);
  }

  /**
   * Generates a unique ID for nodes
   */
  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Exports the entire registry as JSON
   */
  exportToJson(): string {
    const exportData = {
      nodes: Array.from(this.registry.nodes.entries()),
      rootNodeIds: this.registry.rootNodeIds,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Imports a registry from JSON
   * Validates the data before importing
   */
  importFromJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const importData = JSON.parse(jsonString);
      
      // Validate structure
      if (!importData.nodes || !Array.isArray(importData.nodes)) {
        return { success: false, error: 'Invalid format: missing nodes array' };
      }
      
      if (!importData.rootNodeIds || !Array.isArray(importData.rootNodeIds)) {
        return { success: false, error: 'Invalid format: missing rootNodeIds array' };
      }

      // Clear existing registry
      this.clearRegistry();

      // Import nodes
      for (const [id, node] of importData.nodes) {
        this.registry.nodes.set(id, node as FormulaNode);
      }

      // Import root node IDs
      this.registry.rootNodeIds = importData.rootNodeIds;

      // Re-evaluate all root nodes to ensure computed values are correct
      this.evaluateAllRoots();

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Downloads the registry as a JSON file
   */
  downloadAsFile(filename: string = 'formula-tree.json'): void {
    const json = this.exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Creates a sample tree for demonstration showing node reuse
   * Price node is reused in multiple calculations
   */
  createSampleTree(): string[] {
    this.clearRegistry();

    // Create reusable factor nodes
    const price = this.createFactorNode('price', 100, 'Unit price', '$');
    const quantity1 = this.createFactorNode('quantity1', 5, 'Quantity for order 1', 'units');
    const quantity2 = this.createFactorNode('quantity2', 3, 'Quantity for order 2', 'units');
    const taxRate = this.createFactorNode('taxRate', 0.15, 'Tax rate', 'ratio');

    // Order 1 calculations (uses price)
    const subtotal1 = this.createFormulaNode(
      'subtotal1',
      'price * quantity1',
      [price.id, quantity1.id],
      'Subtotal for order 1',
      '$'
    );

    const tax1 = this.createFormulaNode(
      'tax1',
      'subtotal1 * taxRate',
      [subtotal1.id, taxRate.id],
      'Tax for order 1',
      '$'
    );

    const total1 = this.createFormulaNode(
      'total1',
      'subtotal1 + tax1',
      [subtotal1.id, tax1.id],
      'Final total for order 1',
      '$'
    );

    // Order 2 calculations (also uses the same price node!)
    const subtotal2 = this.createFormulaNode(
      'subtotal2',
      'price * quantity2',
      [price.id, quantity2.id],
      'Subtotal for order 2',
      '$'
    );

    const tax2 = this.createFormulaNode(
      'tax2',
      'subtotal2 * taxRate',
      [subtotal2.id, taxRate.id],
      'Tax for order 2',
      '$'
    );

    const total2 = this.createFormulaNode(
      'total2',
      'subtotal2 + tax2',
      [subtotal2.id, tax2.id],
      'Final total for order 2',
      '$'
    );

    // Grand total combining both orders
    const grandTotal = this.createFormulaNode(
      'grandTotal',
      'total1 + total2',
      [total1.id, total2.id],
      'Combined total for both orders',
      '$'
    );

    // Mark the root nodes for display
    this.addRootNode(total1.id);
    this.addRootNode(total2.id);
    this.addRootNode(grandTotal.id);

    return [total1.id, total2.id, grandTotal.id];
  }
}
