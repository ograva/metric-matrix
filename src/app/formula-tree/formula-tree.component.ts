import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormulaNode } from '../models/formula-node.model';
import { FormulaTreeService } from '../services/formula-tree.service';

@Component({
  selector: 'app-formula-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, FormulaTreeComponent],
  templateUrl: './formula-tree.component.html',
  styleUrl: './formula-tree.component.scss'
})
export class FormulaTreeComponent implements OnInit {
  @Input() nodeId!: string;
  @Input() level: number = 0;
  @Output() nodeUpdated = new EventEmitter<void>();

  node: FormulaNode | undefined;
  children: FormulaNode[] = [];
  isExpanded: boolean = true;
  isEditing: boolean = false;
  editableNode: Partial<FormulaNode> = {};

  constructor(private formulaTreeService: FormulaTreeService) {}

  ngOnInit(): void {
    this.loadNode();
  }

  loadNode(): void {
    this.node = this.formulaTreeService.getNode(this.nodeId);
    if (this.node) {
      // Load child nodes from registry
      this.children = this.node.childrenIds
        .map(id => this.formulaTreeService.getNode(id))
        .filter(node => node !== undefined) as FormulaNode[];
    }
  }

  startEditing(): void {
    if (this.node) {
      this.editableNode = { ...this.node };
      this.isEditing = true;
    }
  }

  saveEdit(): void {
    if (this.node) {
      this.formulaTreeService.updateNode(this.node.id, this.editableNode);
      this.isEditing = false;
      this.nodeUpdated.emit(); // Notify parent to refresh data
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editableNode = {};
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  hasChildren(): boolean {
    return this.children.length > 0;
  }

  getIndentStyle(): { [key: string]: string } {
    return {
      'padding-left': `${this.level * 20}px`
    };
  }

  isReusedNode(): boolean {
    return (this.node?.parentIds?.length ?? 0) > 1;
  }

  getParentCount(): number {
    return this.node?.parentIds?.length ?? 0;
  }
}
