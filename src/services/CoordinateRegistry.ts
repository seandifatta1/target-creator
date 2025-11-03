/**
 * Coordinate Registry Service
 * 
 * Manages a registry of all coordinates in the 3D space.
 * Coordinates can be named or unnamed, and are identified by their position.
 */

export interface Coordinate {
  id: string;
  position: [number, number, number];
  name?: string;
}

export interface ICoordinateRegistry {
  /**
   * Register or get a coordinate at the given position.
   * If a coordinate already exists at this position, returns it.
   * Otherwise, creates a new coordinate with a unique ID.
   */
  getOrCreate(position: [number, number, number]): Coordinate;

  /**
   * Get a coordinate by its ID.
   */
  getById(id: string): Coordinate | undefined;

  /**
   * Get a coordinate by its position.
   */
  getByPosition(position: [number, number, number]): Coordinate | undefined;

  /**
   * Get all coordinates.
   */
  getAll(): Coordinate[];

  /**
   * Update a coordinate's name.
   */
  updateName(id: string, name: string): void;

  /**
   * Remove a coordinate from the registry.
   */
  remove(id: string): boolean;

  /**
   * Get all coordinates that match the given positions.
   */
  getByPositions(positions: [number, number, number][]): Coordinate[];

  /**
   * Generate a unique coordinate ID from a position.
   */
  generateId(position: [number, number, number]): string;
}

export class CoordinateRegistry implements ICoordinateRegistry {
  private coordinates: Map<string, Coordinate> = new Map();

  generateId(position: [number, number, number]): string {
    return `coord_${position[0]}_${position[1]}_${position[2]}`;
  }

  getOrCreate(position: [number, number, number]): Coordinate {
    const id = this.generateId(position);
    const existing = this.coordinates.get(id);
    
    if (existing) {
      return existing;
    }

    const newCoordinate: Coordinate = {
      id,
      position,
      name: undefined
    };

    this.coordinates.set(id, newCoordinate);
    return newCoordinate;
  }

  getById(id: string): Coordinate | undefined {
    return this.coordinates.get(id);
  }

  getByPosition(position: [number, number, number]): Coordinate | undefined {
    const id = this.generateId(position);
    return this.coordinates.get(id);
  }

  getAll(): Coordinate[] {
    return Array.from(this.coordinates.values());
  }

  updateName(id: string, name: string): void {
    const coordinate = this.coordinates.get(id);
    if (coordinate) {
      coordinate.name = name;
      this.coordinates.set(id, coordinate);
    }
  }

  remove(id: string): boolean {
    return this.coordinates.delete(id);
  }

  getByPositions(positions: [number, number, number][]): Coordinate[] {
    return positions
      .map(pos => this.getByPosition(pos))
      .filter((coord): coord is Coordinate => coord !== undefined);
  }
}

