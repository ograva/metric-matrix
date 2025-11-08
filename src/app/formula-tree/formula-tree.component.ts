import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormulaNode } from '../models/formula-node.model';
import { FormulaTreeService } from '../services/formula-tree.service';

@Component({
  selector: 'app-formula-tree',
  imports: [CommonModule],
  templateUrl: './formula-tree.component.html',
  styleUrl: './formula-tree.component.scss'
})
export class FormulaTreeComponent implements OnInit {
  @Input() nodeId!: string;
  @Input() level: number = 0;

  node: FormulaNode | undefined;
  children: FormulaNode[] = [];
  isExpanded: boolean = true;

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
