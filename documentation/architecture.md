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



