# Memory Creation Examples

## Episodic Memory
```javascript
{
  type: "episodic",
  content: "Had breakthrough conversation about quantum gravity with Eric",
  embedding: [0.1, 0.2, 0.3, ...], // 1536 dimensions
  importance: 0.9,
  metadata: {
    action_taken: "theoretical_exploration",
    context: "physics_discussion", 
    result: "developed_egr_framework",
    emotional_valence: 0.8,
    event_time: "2024-01-15T10:30:00Z"
  }
}
```

## Semantic Memory
```javascript
{
  type: "semantic",
  content: "Quantum error-correcting codes can implement spacetime emergence",
  embedding: [0.2, 0.4, 0.1, ...],
  importance: 0.7,
  metadata: {
    confidence: 0.8,
    category: ["physics", "quantum_information"],
    related_concepts: ["holography", "entanglement", "emergence"]
  }
}
```
