# Constraints Algorithm Documentation

## Introduction

The constraints algorithm is a critical component of our system, responsible for managing and evaluating logical and arithmetic constraints associated with variables. This documentation provides an overview of how the constraints algorithm is implemented and how it handles various scenarios.

## Table of Contents

- [Data Structures](data-structures)
  - [Logical Trees](#logical-trees)
  - [Variable References](#variable-references)
  - [Constraint Nodes](#constraint-nodes)


## Data Structures

The constraints algorithm utilizes various data structures to represent and manage constraints within the system. Understanding these data structures is essential for comprehending how the algorithm works.

### Logical Trees

Logical trees are a fundamental structure for representing constraints. They consist of nodes that can be either logical expressions or arithmetic expressions. These trees are used to model the structure of constraints, allowing us to evaluate and manage complex relationships.

### Variable References

Variables and constraints in the system maintain references to the logical tree nodes where they appear. This association enables efficient tracking of which constraints are impacted when a variable or constraint undergoes changes, such as unification with a constant or another variable.

### Constraint Nodes

Each node in the logical tree represents a constraint. Constraint nodes have the following attributes:

- Type (op): Indicates whether the constraint is logical or arithmetic.
- Expression: Contains the specific constraint expression.
- State: Records the state of the constraint (C_TRUE, C_FALSE, or C_UNKNOWN).
- Logical Root-Node: Points to the logical root-node that governs this constraint, it also stores the position on the left ('a') or right ('b') side relative to the logical root-node.
- Intermediate Value: Stores an intermediate value if the constraint's state changes to C_TRUE during evaluation.

The Logical Root-Node attribute is crucial for understanding the hierarchy and evaluation of constraints within the system. It specifies the top-level logical node that encompasses this constraint.

The rules to determine and store the Logical Root-Node are as follows:

- The tree root node has no logical root.
- Each child node will store a reference to its logical root along with the side it belongs to ('a' for left or 'b' for right) relative to its logical root.
- The logical root is the first OR-parent node encountered while traversing up the logical tree. If no OR-parent node is found, it defaults to the tree root node.

This hierarchical structure helps determine the context in which constraints are evaluated and facilitates efficient constraint management.

## Constraints Evaluation/Check

In the system, constraints are checked when variables are unified with values or variables. The constraint-checking process is vital for ensuring the logical and arithmetic validity of expressions within the system. This section outlines how constraint evaluation and checking are carried out.

### Triggering Constraint Checks

1. **Variable Unification**: When a variable is unified with a value or another variable, the system triggers a constraint check for all references to that variable. These references are constraint nodes where the variable appears.

2. **`checkVariableConstraints` Function**: The `checkVariableConstraints` function is responsible for checking constraints. It returns `true` if all constraints pass or `false` if any branch should fail.

### Constraint Evaluation and Checking

1. **Environment Flags**: Constraints do not have predefined environment flags. Instead, the environment flags (`stop`, `eval`, `check`) for a constraint are calculated dynamically using the `constraintEnv(root)` function, where `root` is the logical root of the constraint.

2. **Default Environment**:
   - If a constraint does not have a OR-logical root, its default environment is `{stop: true, eval: true, check: true}`. This means it can be evaluated, it should fail all branch if constraint returns C_FALSE, and it must checked. 

3. **OR Expression Context**:
   - If a constraint is inside an OR expression, its environment depends on the other side of the OR:
     - If the other side of the OR is `C_FALSE`, the constraint's environment becomes `{stop: false, eval: false, check: false}` (do nothing).
     - If the other side of the OR is not `C_FALSE`, the constraint's environment is calculated recursively using `constraintEnv(cs.root)` to determine the next logical constraint's environment.

4. **Constraint Check/Evaluation Results**:
   - Constraint checks can return one of the following states: `C_FALSE`, `C_TRUE`, or `C_UNKNOWN`.
   - If the result is `C_FALSE`, and `stop` is `true`, the branch fails immediately.
   - If the result is `C_FALSE`, but `stop` is `false`, the logical-root side is updated to `C_FALSE`.
   - If the result is `C_TRUE`, the constraint is added to a list for further checking with `checkVariableConstraints`.

### Dynamic Handling of Environments

The dynamic handling of environment flags based on the context within the logical tree allows the system to efficiently manage constraint checks. This approach ensures that constraints are evaluated or checked as needed while considering the logical hierarchy.

By dynamically adjusting the environment flags, the system optimizes the evaluation and checking of constraints, improving overall efficiency.

This section provides an overview of the constraint evaluation and checking process, highlighting the role of environment flags in determining when and how constraints are assessed within the system.
