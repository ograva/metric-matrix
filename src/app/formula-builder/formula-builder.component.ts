import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormulaTreeComponent } from '../formula-tree/formula-tree.component';
import { FormulaTreeService } from '../services/formula-tree.service';
import { FormulaNode } from '../models/formula-node.model';

@Component({
  selector: 'app-formula-builder',
  imports: [CommonModule, FormsModule, FormulaTreeComponent],
  templateUrl: './formula-builder.component.html',
  styleUrl: './formula-builder.component.scss'
})
export class FormulaBuilderComponent implements OnInit {
  rootNodeIds: string[] = [];
  
  // Form fields for creating new nodes
  newNodeName: string = '';
  newNodeType: 'formula' | 'factor' = 'factor';
  newNodeValue: number = 0;
  newNodeFormula: string = '';
  newNodeDescription: string = '';
  newNodeUnit: string = '';
  
  selectedParentId: string | null = null;
  selectedChildIds: string[] = [];
  allNodes: FormulaNode[] = [];
  availableNodes: FormulaNode[] = [];

  // Compute child feature fields
  computeParentId: string | null = null;
  computeChildId: string | null = null;
  computeTargetValue: number = 0;
  computedChildValue: number | null = null;
  computeError: string | null = null;

  constructor(public formulaTreeService: FormulaTreeService) {}

  ngOnInit(): void {
    this.loadSampleTree();
  }

  loadSampleTree(): void {
    this.rootNodeIds = this.formulaTreeService.createSampleTree();
    this.updateNodeList();
  }

  createNewNode(): void {
    if (!this.newNodeName.trim()) {
      alert('Please enter a node name');
      return;
    }

    let newNode: FormulaNode;

    if (this.newNodeType === 'factor') {
      newNode = this.formulaTreeService.createFactorNode(
        this.newNodeName,
        this.newNodeValue,
        this.newNodeDescription || undefined,
        this.newNodeUnit || undefined
      );
    } else {
      if (!this.newNodeFormula.trim()) {
        alert('Please enter a formula');
        return;
      }
      newNode = this.formulaTreeService.createFormulaNode(
        this.newNodeName,
        this.newNodeFormula,
        this.selectedChildIds,
        this.newNodeDescription || undefined,
        this.newNodeUnit || undefined
      );
    }

    if (this.selectedParentId) {
      this.formulaTreeService.addChild(this.selectedParentId, newNode.id);
      this.formulaTreeService.evaluateAllRoots();
    } else {
      // If no parent selected, add as a root
      this.formulaTreeService.addRootNode(newNode.id);
      this.rootNodeIds = this.formulaTreeService.getRegistry().rootNodeIds;
    }

    this.updateNodeList();
    this.resetForm();
  }

  updateNodeValue(node: FormulaNode, newValue: number): void {
    this.formulaTreeService.updateNode(node.id, { value: newValue });
    this.updateNodeList();
  }

  resetForm(): void {
    this.newNodeName = '';
    this.newNodeType = 'factor';
    this.newNodeValue = 0;
    this.newNodeFormula = '';
    this.newNodeDescription = '';
    this.newNodeUnit = '';
    this.selectedParentId = null;
    this.selectedChildIds = [];
  }

  updateNodeList(): void {
    this.allNodes = this.formulaTreeService.getAllNodes();
    this.availableNodes = this.allNodes.filter(n => n.type === 'factor' || n.type === 'formula');
  }

  resetTree(): void {
    this.formulaTreeService.clearRegistry();
    this.rootNodeIds = [];
    this.updateNodeList();
    this.resetForm();
  }

  onNodeTypeChange(): void {
    // Clear irrelevant fields when type changes
    if (this.newNodeType === 'factor') {
      this.newNodeFormula = '';
      this.selectedChildIds = [];
    } else {
      this.newNodeValue = 0;
    }
  }

  toggleChildSelection(nodeId: string): void {
    const index = this.selectedChildIds.indexOf(nodeId);
    if (index === -1) {
      this.selectedChildIds.push(nodeId);
    } else {
      this.selectedChildIds.splice(index, 1);
    }
  }

  isChildSelected(nodeId: string): boolean {
    return this.selectedChildIds.includes(nodeId);
  }

  getFactorNodes(): FormulaNode[] {
    return this.allNodes.filter(n => n.type === 'factor');
  }

  exportTree(): void {
    this.formulaTreeService.downloadAsFile('formula-tree.json');
  }

  importTree(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = this.formulaTreeService.importFromJson(content);
      
      if (result.success) {
        this.rootNodeIds = this.formulaTreeService.getRegistry().rootNodeIds;
        this.updateNodeList();
        alert('Tree imported successfully!');
      } else {
        alert(`Import failed: ${result.error}`);
      }
      
      // Reset the file input
      input.value = '';
    };

    reader.onerror = () => {
      alert('Failed to read file');
      input.value = '';
    };

    reader.readAsText(file);
  }

  computeChild(): void {
    if (!this.computeParentId || !this.computeChildId) {
      alert('Please select both parent and child nodes');
      return;
    }

    const result = this.formulaTreeService.computeChildValue(
      this.computeParentId,
      this.computeChildId,
      this.computeTargetValue
    );

    if (result.success && result.value !== undefined) {
      this.computedChildValue = result.value;
      this.computeError = null;
    } else {
      this.computedChildValue = null;
      this.computeError = result.error || 'Unknown error occurred';
    }
  }

  applyComputedValue(): void {
    if (this.computedChildValue === null || !this.computeChildId) {
      return;
    }

    const child = this.formulaTreeService.getNode(this.computeChildId);
    if (child) {
      this.formulaTreeService.updateNode(this.computeChildId, { value: this.computedChildValue });
      this.updateNodeList();
      alert(`Successfully applied: ${child.name} = ${this.computedChildValue.toFixed(4)}`);
      this.resetComputeForm();
    }
  }

  resetComputeForm(): void {
    this.computeParentId = null;
    this.computeChildId = null;
    this.computeTargetValue = 0;
    this.computedChildValue = null;
    this.computeError = null;
  }

  getFormulaNodes(): FormulaNode[] {
    return this.allNodes.filter(n => n.type === 'formula');
  }

  getChildrenOfParent(parentId: string | null): FormulaNode[] {
    if (!parentId) {
      return [];
    }
    const parent = this.formulaTreeService.getNode(parentId);
    if (!parent) {
      return [];
    }
    return parent.childrenIds
      .map(id => this.formulaTreeService.getNode(id))
      .filter(n => n !== undefined) as FormulaNode[];
  }
}
