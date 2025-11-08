import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as go from 'gojs';

@Component({
  selector: 'app-gojs-diagram',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gojs-diagram.component.html',
  styleUrls: ['./gojs-diagram.component.scss']
})
export class GojsDiagramComponent implements AfterViewInit, OnChanges {
  @Input() nodes: go.ObjectData[] = [];
  @Input() links: go.ObjectData[] = [];

  @ViewChild('diagramDiv') diagramDiv!: ElementRef;

  private diagram!: go.Diagram;
  direction: 'vertical' | 'horizontal' = 'vertical';

  ngAfterViewInit(): void {
    const $ = go.GraphObject.make;

    this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      'undoManager.isEnabled': true,
      layout: this.createLayout()
    });

    // Define the node template
    this.diagram.nodeTemplate =
      $(go.Node, 'Vertical',
        { selectionObjectName: "PANEL", fromSpot: this.getFromSpot(), toSpot: this.getToSpot() },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Panel, "Auto",
            { name: "PANEL" },
            $(go.Shape, 'RoundedRectangle',
              { fill: "white", stroke: "#ccc", strokeWidth: 2 },
              new go.Binding('fill', 'background')),
            $(go.Panel, "Vertical",
                { margin: 10 },
                $(go.TextBlock,
                    {
                        stroke: "#333",
                        font: "bold 14px sans-serif",
                        margin: new go.Margin(0, 0, 4, 0),
                        alignment: go.Spot.Left
                    },
                    new go.Binding('text', 'name')),
                $(go.TextBlock,
                    {
                        stroke: "#555",
                        font: "13px sans-serif",
                        alignment: go.Spot.Left
                    },
                    new go.Binding('text', 'details')),
                $(go.TextBlock,
                    {
                        stroke: "#1E88E5",
                        font: "bold 16px sans-serif",
                        margin: new go.Margin(8, 0, 0, 0),
                        alignment: go.Spot.Right
                    },
                    new go.Binding('text', 'value'))
            )
        )
      );

    // Define the link template
    this.diagram.linkTemplate =
      $(go.Link,
        { routing: go.Link.Orthogonal, corner: 10 },
        $(go.Shape, { strokeWidth: 2, stroke: '#555' }),
        $(go.Shape, { toArrow: 'Standard', fill: '#555', stroke: '#555' })
      );

    this.updateDiagram();
  }

  private createLayout(): go.Layout {
    const $ = go.GraphObject.make;
    return $(go.TreeLayout, { 
      angle: this.direction === 'vertical' ? 0 : 90,
      layerSpacing: 80,
      nodeSpacing: 20
    });
  }

  private getFromSpot(): go.Spot {
    return this.direction === 'vertical' ? go.Spot.Bottom : go.Spot.Right;
  }

  private getToSpot(): go.Spot {
    return this.direction === 'vertical' ? go.Spot.Top : go.Spot.Left;
  }

  toggleDirection(): void {
    this.direction = this.direction === 'vertical' ? 'horizontal' : 'vertical';
    this.diagram.layout = this.createLayout();
    // Update node spots
    this.diagram.nodeTemplate = this.diagram.nodeTemplate.copy();
    this.diagram.nodeTemplate.fromSpot = this.getFromSpot();
    this.diagram.nodeTemplate.toSpot = this.getToSpot();
    this.diagram.layoutDiagram(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.diagram && (changes['nodes'] || changes['links'])) {
      this.updateDiagram();
    }
  }

  private updateDiagram(): void {
    if (!this.diagram) return;

    this.diagram.model = new go.GraphLinksModel(this.nodes, this.links);
  }
}
