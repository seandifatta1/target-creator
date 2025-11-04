# Target Creator

A powerful 3D visualization and relationship management application for creating, organizing, and managing targets, paths, and their many-to-many relationships in a three-dimensional space.

## Overview

Target Creator provides an intuitive interface for placing targets and paths on an infinite 3D grid, managing relationships between them, and visualizing their connections. The application supports multiple coordinate systems and offers flexible relationship management through an easy-to-use interface.

## Getting Started

### Launching the Application

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Navigate to `http://localhost:6007`

### First Steps

1. **Explore the 3D Grid**: The main canvas shows a 3D grid with blue grid points
2. **Navigate the View**: Use your mouse to orbit, zoom, and pan the 3D view
3. **Open the Sidebar**: Click the hamburger menu on the right to see available targets and paths
4. **Place Your First Target**: Drag a target from the sidebar or right-click on a grid point

## Core Features

### 1. 3D Grid System

The application features an infinite 3D grid system that serves as your workspace.

**Grid Points**
- Blue dots indicate available placement locations
- Click on grid points to place items
- Grid points snap to integer coordinates for precise placement

**Navigation**
- **Orbit**: Click and drag to rotate the view around the scene
- **Zoom**: Scroll your mouse wheel to zoom in/out
- **Pan**: Hold right-click and drag to pan the view
- **Reset Camera**: Click "Reset Camera" in the controls panel to return to default view

**Controls Panel**
- Located in the top-left corner of the canvas
- Click to expand/collapse for quick access to camera controls
- Shows current coordinate system information

### 2. Placing Targets

Targets are the primary objects you can place in your 3D space. Each target represents a point of interest with a specific location.

**Methods to Place Targets**

1. **Drag and Drop**
   - Open the right sidebar (hamburger menu)
   - Drag a target from the "Target browser" section
   - Drop it onto any grid point in the 3D view

2. **Right-Click Context Menu**
   - Right-click on any grid point
   - Select "Add Target" from the context menu
   - A new target will be placed at that location

**Target Features**
- **Visual Display**: Targets appear as emoji icons (🎯 by default) above the grid
- **Annotations**: Click on a target to open its annotation showing coordinates
- **Naming**: Right-click on a target to open the naming modal and assign a custom name
- **Hover Feedback**: Hover over targets to see their labels and coordinates in a tooltip
- **Selection**: Click a target to select it and view details in the bottom drawer

**Target Details**
- Target ID and label
- Custom name (if assigned)
- Position coordinates in the current coordinate system
- Relationships with paths and coordinates

### 3. Creating Paths

Paths connect points in 3D space and can represent routes, trajectories, or connections between locations.

**Creating a Line Path**

1. **Right-Click Method**
   - Right-click on any grid point
   - Select "Start Path" → "Line"
   - A toast notification will appear indicating path creation mode is active
   - Click on another grid point to set the endpoint
   - The path will automatically connect all points between start and end

**Path Creation Mode**
- **Start Point**: Highlighted in red when path creation begins
- **Valid Endpoints**: White glowing points indicate valid endpoint locations
- **Straight Lines**: Only straight or diagonal connections are allowed
- **Visual Feedback**: 
  - Red highlight = start position
  - White glow = valid endpoint
  - Error toast = invalid endpoint selection

**Path Features**
- **Line Type**: Straight lines connecting two points
- **Visualization**: Paths appear as white lines (or purple if related to selected item)
- **Auto-Interpolation**: All integer points between start and end are automatically included
- **Naming**: Right-click on a path to assign a custom name
- **Selection**: Click on a path to view its details and coordinates

**Path Details**
- Path name and type
- Complete list of all coordinates the path passes through
- Relationship information with targets and coordinates

### 4. Coordinate Systems

Target Creator supports three coordinate systems to match your workflow needs.

**Accessing Settings**
- Click the gear icon (⚙️) in the top-left corner of the canvas
- Or use the settings button in the toolbar

**Available Systems**

1. **NED (North-East-Down)**
   - X-axis: North (positive = North)
   - Y-axis: East (positive = East)
   - Z-axis: Down (positive = Down)
   - Units: Kilometers
   - Common in aviation and navigation applications

2. **Cartesian (X-Y-Z)**
   - Standard 3D Cartesian coordinates
   - X-axis: Horizontal
   - Y-axis: Vertical
   - Z-axis: Depth/Forward
   - Units: Kilometers
   - General-purpose coordinate system

3. **Spherical (R-θ-φ)**
   - R: Radius from origin (km)
   - θ: Azimuth angle (degrees, 0° = North)
   - φ: Elevation angle (degrees, 0° = horizontal)
   - Units: Kilometers + Degrees
   - Useful for radar and tracking systems

**Configuration**
- Minimum Unit: Adjust the resolution/precision (0.1-10 km for NED/Cartesian, degrees for Spherical)
- System-specific tooltips show coordinate values in your selected system

### 5. Relationship Management

One of Target Creator's most powerful features is its flexible many-to-many relationship system connecting targets, paths, and coordinates.

**Understanding Relationships**

- **Targets ↔ Coordinates**: Each target is linked to a coordinate (one-to-one)
- **Paths ↔ Coordinates**: Paths are linked to multiple coordinates (one-to-many)
- **Indirect Relationships**: Targets and paths are automatically related if they share coordinates

**Visual Relationship Indicators**

When you select an item, related items are automatically highlighted:
- **Selected Items**: Green highlighting
- **Related Items**: Purple highlighting with:
  - Larger text for targets
  - Thicker lines for paths
  - Enhanced visibility for easy identification

**Managing Relationships**

1. **View Relationships**
   - Select any target, path, or coordinate
   - Open the bottom drawer to see relationship details
   - Relationship counts show how many items are connected
   - Click on related items to navigate to them

2. **Link Coordinates to Targets**
   - Select a target in the drawer
   - In the "Relationships" section, click "Link Coordinate"
   - Choose a coordinate from the dropdown menu
   - Checkmarks indicate already-linked coordinates
   - Click to toggle relationships on/off

3. **Link Coordinates to Paths**
   - Select a path in the drawer
   - Click "Link Coordinates" in the relationships section
   - Select multiple coordinates to link to the path
   - Toggle individual coordinate relationships

4. **Remove Relationships**
   - View linked items in the relationships list
   - Click the × button next to any relationship to remove it
   - Relationships can be restored by re-linking

**Relationship Display**
- **Counts**: See how many targets, paths, and coordinates are related
- **Interactive Lists**: Click on related item names to navigate to them
- **Visual Feedback**: Related items are highlighted in purple in the 3D view

### 6. Item Details and Drawer

The bottom drawer provides comprehensive information about selected items.

**Accessing the Drawer**
- Click on any target, path, or coordinate
- The drawer automatically opens from the bottom
- Click outside the drawer or press Escape to close

**Drawer Sections**

1. **Left Panel - Item Details**
   - **Target Information**: ID, name, position, relationships
   - **Path Information**: Name, type, coordinate count, full coordinate table
   - **Coordinate Information**: Name, position, linked targets and paths

2. **Right Panel - Tab Navigation**
   - **Targets Tab**: Browse and select from all placed targets
   - **Paths Tab**: Browse and select from all created paths
   - **Coordinates Tab**: Browse and select from all registered coordinates

**Coordinate Tables**
- For paths, view a complete table of all X, Y, Z coordinates
- Scrollable table with hover effects
- Shows every point the path passes through

**Relationship Management in Drawer**
- All relationship management controls are in the left panel
- Link/unlink controls are contextually available
- Real-time updates when relationships change

### 7. Context Menus

Right-click functionality provides quick access to common actions.

**Grid Point Context Menu**
- **Add Target**: Place a new target at this location
- **Start Path → Line**: Begin creating a line path from this point

**Item Context Menus**
- **Target**: Right-click to open naming modal
- **Path**: Right-click to open naming modal

### 8. Naming Items

Custom names help organize and identify your targets, paths, and coordinates.

**Naming Methods**
1. Right-click on any item and select "Name" (if available)
2. Use the naming modal that appears when placing new items
3. Access via item context menu

**Naming Modal**
- Enter a custom name for the item
- Names are displayed in relationship lists and details
- Can be changed at any time

### 9. Visual Feedback and Indicators

**Color Coding**
- **Blue**: Grid points (available placement locations)
- **White**: Normal targets and paths
- **Green**: Selected items
- **Purple**: Related items (when another item is selected)
- **Red**: Start point during path creation

**Hover Effects**
- Targets show tooltips with label and coordinates
- Paths become clickable with cursor change
- Grid points highlight when hovered

**Selection Indicators**
- Selected items turn green
- Related items turn purple
- Drawer automatically opens with item details

## Workflow Examples

### Example 1: Creating a Target Network

1. **Place Multiple Targets**
   - Drag targets from the sidebar or use right-click menu
   - Place them at strategic locations on the grid

2. **Name Your Targets**
   - Right-click each target to assign meaningful names
   - Use names like "Base Camp", "Observation Point", etc.

3. **View Relationships**
   - Select a target to see which paths pass through its coordinate
   - Navigate between related targets via the relationships list

### Example 2: Creating a Route Path

1. **Start Path Creation**
   - Right-click on your starting point
   - Select "Start Path" → "Line"

2. **Set Endpoint**
   - Click on a valid endpoint (highlighted in white)
   - The path will automatically connect all intermediate points

3. **Name the Path**
   - Right-click on the created path
   - Assign a name like "Main Route" or "Supply Line"

4. **View Path Coordinates**
   - Select the path to open the drawer
   - Scroll through the coordinate table to see every point

### Example 3: Managing Complex Relationships

1. **Select a Target**
   - Click on a target to see its relationships

2. **Link Additional Coordinates**
   - In the drawer, click "Link Coordinate"
   - Select coordinates that should be associated with this target
   - Use checkmarks to see current status

3. **Visualize Connections**
   - Related paths will automatically highlight in purple
   - Navigate between related items by clicking their names

4. **Remove Relationships**
   - Click the × button next to any relationship
   - Relationships are immediately updated

## Tips and Best Practices

1. **Use Descriptive Names**: Assign meaningful names to targets and paths for easier navigation
2. **Leverage Visual Highlighting**: Select items to quickly see all related items highlighted in purple
3. **Coordinate Tables**: Use path coordinate tables to verify exact routes and positions
4. **Relationship Management**: Regularly review and update relationships to keep data organized
5. **Coordinate Systems**: Choose the coordinate system that matches your domain (NED for aviation, Spherical for radar)
6. **Grid Navigation**: Use the reset camera button if you get lost in the 3D space
7. **Drawer Navigation**: Use the right panel tabs to quickly switch between different item types

## Keyboard Shortcuts

- **Escape**: Close drawer or cancel modals
- **Click Outside**: Close drawer or context menus
- **Mouse Wheel**: Zoom in/out
- **Click + Drag**: Orbit camera
- **Right-Click + Drag**: Pan camera

## Troubleshooting

**Path Creation Not Working**
- Ensure you're clicking on valid endpoints (white glowing points)
- Only straight or diagonal lines are supported
- Check the toast notification for error messages

**Relationships Not Showing**
- Make sure items share coordinates to be related
- Use the "Link Coordinate" button to manually create relationships
- Refresh the view by selecting the item again

**Can't See Items Clearly**
- Use the zoom controls (mouse wheel)
- Click "Reset Camera" to return to default view
- Adjust your view angle by orbiting the camera

**Drawer Not Opening**
- Ensure an item is selected (should be green)
- Try clicking the item again
- Check that the drawer isn't hidden off-screen

## Technical Details

**Supported Formats**
- Coordinate systems: NED, Cartesian, Spherical
- Grid resolution: Configurable minimum units
- Path types: Straight lines (diagonal supported)

**Data Persistence**
- Relationships are managed in-memory
- Coordinate registry tracks all grid positions
- Item names and relationships persist during session

## Additional Resources

- **Development**: See project structure in codebase
- **Components**: Individual component documentation available in Storybook
- **Settings**: Access coordinate system settings via gear icon

---

**Version**: 1.0.0  
**Last Updated**: Current  
**Status**: Active Development
