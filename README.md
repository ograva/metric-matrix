# MetricMatrix

A formula tree modeling application built with Angular 19 that enables you to create hierarchical formula structures where parent nodes compute values from child nodes (factors). **Nodes can be reused across multiple formulas**, making it perfect for complex calculations where shared values update everywhere automatically.

## Overview

MetricMatrix uses a tree structure to model formulas:
- **Factor nodes** contain direct numeric values (e.g., price, quantity, tax rate)
- **Formula nodes** compute values using expressions that reference child nodes (e.g., `price * quantity`)
- **Reusable nodes** can be shared across multiple parent formulas — update once, propagate everywhere

## Key Features

### 🔄 Node Reuse
A single node (like `price`) can be used by multiple parent formulas. When you update a shared factor value, all dependent formulas automatically recalculate through the entire tree hierarchy.

### 🌲 Tree Visualization
- Color-coded nodes (green for formulas, blue for factors)
- Expandable/collapsible tree structure
- Visual indicators for reused nodes (♻️ badge and dashed borders)
- Real-time computed values displayed alongside formulas

### ⚡ Live Calculation
- Formulas evaluate automatically when values change
- Changes propagate through parent-child relationships
- Support for basic arithmetic: `+`, `-`, `*`, `/`, `()`

### 🎨 Interactive Builder
- Form-based node creation (factor or formula types)
- Select existing nodes as children when building formulas
- Quick-edit panel for updating factor values
- Multiple root trees displayed simultaneously

### 💾 Export/Import
- Export entire tree structure to JSON file
- Import previously saved trees
- Preserves all nodes, relationships, and values
- Perfect for backup, sharing, or version control

### 🧮 Reverse Calculation (Compute Child)
- Solve for a child node's value given a desired parent result
- Algebraic solver for simple formulas (instant)
- Numerical solver for complex formulas (iterative)
- Preview computed value before applying
- Two-step workflow: compute → review → apply

## Sample Use Case

The included sample tree demonstrates a practical scenario with node reuse:

```
Order 1:
  total1 = subtotal1 + tax1
    ├── subtotal1 = price × quantity1  ← uses shared price
    └── tax1 = subtotal1 × taxRate      ← uses shared taxRate

Order 2:
  total2 = subtotal2 + tax2
    ├── subtotal2 = price × quantity2  ← uses same shared price!
    └── tax2 = subtotal2 × taxRate      ← uses same shared taxRate!

Grand Total:
  grandTotal = total1 + total2
```

**When you change the `price` factor:**
1. Both `subtotal1` and `subtotal2` recalculate
2. Then `tax1` and `tax2` update
3. Finally `total1`, `total2`, and `grandTotal` cascade
4. All automatically through the parent reference chain!

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Quick Start

1. **Start the app**: `npm start`
2. **Load sample tree**: Click "📊 Load Sample Tree" in the sidebar
3. **Try node reuse**: 
   - Find the `price` factor in the "Quick Edit Factor Values" panel
   - Change its value (try 150 instead of 100)
   - Watch both order totals and the grand total recalculate instantly!
4. **Try reverse calculation**:
   - In the "🧮 Compute Child Value" panel, select a formula node as parent
   - Choose a child to solve for
   - Set a target value and click "⚡ Compute Child Value"
   - Review the computed result and click "✔️ Apply Value" to update
5. **Export your work**: Click "💾 Export Tree" to save as JSON
6. **Import later**: Click "📂 Import Tree" to restore a saved tree
7. **Create your own**: Use the form to add new factor or formula nodes

## Project Structure

- `src/app/models/formula-node.model.ts` - Data models for nodes and registry
- `src/app/services/formula-tree.service.ts` - Tree operations, formula evaluation, node management, and reverse calculation
- `src/app/formula-tree/` - Recursive tree visualization component
- `src/app/formula-builder/` - Main UI for building and editing trees
- `src/app/home/` - Landing page with feature overview

## Technical Details

- **Angular 19** with standalone component architecture
- **Registry-based node management** - All nodes stored in a central Map by ID
- **Reference-based relationships** - Nodes reference children by ID (`childrenIds: string[]`)
- **Bidirectional tracking** - Both parent and child references maintained
- **Safe formula evaluation** - Validates expressions before evaluation
- **Circular dependency detection** - Prevents infinite loops during evaluation
- **Algebraic & numerical solvers** - Smart reverse calculation using multiple solving strategies

## Additional Documentation

For detailed technical documentation, see:
- **`export-import.txt`** - Complete export/import feature documentation
- **`compute-child-feature.txt`** - Reverse calculation implementation details
- **`.github/copilot-instructions.md`** - Developer guidance and project conventions

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
npm run build
```

This will compile your project and store the build artifacts in the `dist/metric-matrix` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
npm test
```

## Additional Resources

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Angular Documentation](https://angular.dev)

---

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.1.

