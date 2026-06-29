export const MOCK_ARCHITECTURE = {
  walls: [
    // Perimeter - Main Hall
    { start: [0, 0], end: [15, 0], thickness: 0.2, height: 3.0 },
    { start: [15, 0], end: [15, 12], thickness: 0.2, height: 3.0 },
    { start: [15, 12], end: [0, 12], thickness: 0.2, height: 3.0 },
    { start: [0, 12], end: [0, 0], thickness: 0.2, height: 3.0 },
    
    // Living Area / Kitchen Divider
    { start: [0, 7], end: [8, 7], thickness: 0.15, height: 2.8 },
    { start: [8, 0], end: [8, 7], thickness: 0.15, height: 2.8 },
    
    // Bedroom Suites
    { start: [8, 7], end: [15, 7], thickness: 0.15, height: 2.8 },
    { start: [11.5, 7], end: [11.5, 12], thickness: 0.15, height: 2.8 },
    
    // Bathrooms
    { start: [8, 10], end: [10, 10], thickness: 0.1, height: 2.5 },
    { start: [10, 7], end: [10, 12], thickness: 0.1, height: 2.5 },
  ],
  rooms: [
    { name: "Skyline Lounge", corners: [[0,0], [8,0], [8,7], [0,7]] },
    { name: "Designer Kitchen", corners: [[0,7], [8,7], [8,12], [0,12]] },
    { name: "Master Sanctuary", corners: [[8,0], [15,0], [15,7], [8,7]] },
    { name: "Junior Suite", corners: [[11.5,7], [15,7], [15,12], [11.5,12]] },
    { name: "Neural Bath I", corners: [[10,7], [11.5,7], [11.5,10], [10,10]] },
    { name: "Hallway Nexus", corners: [[8,7], [10,7], [10,12], [8,12]] }
  ],
  metadata: {
    generatedBy: "Neural Architecture 2.0",
    simulationType: "Luxury Penthouse",
    timestamp: new Date().toISOString()
  }
};
