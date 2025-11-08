/**
 * Represents a node in the formula tree.
 * Parent nodes contain formulas that compute values from child nodes (factors).
 * Nodes can be reused across multiple parents through references.
 */
export interface FormulaNode {
  id: string;
  name: string;
  type: 'formula' | 'factor';
  
  // For formula nodes: the expression to evaluate (e.g., "a + b", "a * b / 100")
  formula?: string;
  
  // For factor nodes: the direct numeric value
  value?: number;
  
  // Child node references (IDs of nodes used in the formula)
  // Allows nodes to be reused across multiple parents
  childrenIds: string[];
  
  // Computed value (evaluated from formula or direct value)
  computedValue?: number;
  
  // Optional metadata
  description?: string;
  unit?: string;
  
  // Track which parent nodes reference this node (for change propagation)
  parentIds?: string[];
}

/**
 * Represents the evaluation context for formula parsing.
 * Maps variable names to their computed values.
 */
export interface EvaluationContext {
  [key: string]: number;
}

/**
 * Result of formula evaluation
 */
export interface EvaluationResult {
  success: boolean;
  value?: number;
  error?: string;
}

/**
 * Registry to manage all nodes and their relationships
 * Enables node reuse across multiple parents
 */
export interface NodeRegistry {
  nodes: Map<string, FormulaNode>;
  rootNodeIds: string[];
}

/**
 * Helper type for building trees with node references
 */
export interface NodeReference {
  nodeId: string;
  node: FormulaNode;
}
