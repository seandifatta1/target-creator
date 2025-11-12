/**
 * Grid Items Type Definitions
 * 
 * Core data model for Targets, Paths, and Coordinates.
 * These are the fundamental entities in the grid system.
 */

/**
 * Target - Represents a target object in the grid
 * 
 * **How it's used in the app:**
 * Targets are placed on paths and represent points of interest. Each target
 * belongs to exactly one path. The target's start coordinate can be derived
 * from the path's first coordinate.
 * 
 * **Relationships:**
 * - Target → Path: One-to-one (each target has one pathId)
 * - Target → Coordinate: Derived from path (first coordinate in path)
 */
export interface Target {
  id: string;
  label: string;
  pathId: string; // ID of the ONE path this target is on
}

/**
 * Path - Represents a path connecting coordinates
 * 
 * **How it's used in the app:**
 * Paths connect coordinates in sequence and belong to a target. A path
 * contains an ordered array of coordinates that define the route.
 * 
 * **Relationships:**
 * - Path → Target: One-to-one (each path has one targetId)
 * - Path → Coordinates: One-to-many (path contains multiple coordinates)
 */
export interface Path {
  id: string;
  label: string;
  targetId: string; // ID of the target this path belongs to
  coordinates: Coordinate[]; // Array of Coordinate objects (ordered)
}

/**
 * Coordinate - Represents a coordinate point in the grid
 * 
 * **How it's used in the app:**
 * Coordinates can be standalone grid items with relationships, or just
 * position values. When used as a grid item, it tracks which paths and
 * targets pass through it.
 * 
 * **Relationships:**
 * - Coordinate → Paths: Many-to-many (one coordinate can be on multiple paths)
 * - Coordinate → Targets: Many-to-many (derived from paths that go through coordinate)
 * 
 * **Note:** The `id` field is optional as it might not always be used,
 * but when a coordinate is a grid item, it should have an id.
 */
export interface Coordinate {
  id?: string; // Optional - might not end up using it
  label: string;
  position: [number, number, number]; // The coordinate value
  paths: Path[]; // All paths that go through this coordinate
  targets: Target[]; // All targets that go through this (derived from paths)
}

/**
 * Base interface for all grid items
 * All grid items share id and label
 */
export interface GridItem {
  id: string;
  label: string;
}

