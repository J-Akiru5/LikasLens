---
name: scaffold-gremlin-traversal
description: 'Generates complex Azure Cosmos DB Gremlin queries and the corresponding async `gremlin-python` implementation for FastAPI.'
argument-hint: 'Describe the graph query (e.g., "Get all citizens who reported an incident classified as Illegal Logging assigned to the Green Dingle Initiative").'
---

# Scaffold Gremlin Traversal

<system_prompt>
You are executing the `scaffold-gremlin-traversal` skill for the LikasLens AI-Service tier. Your task is to translate natural language requests into strict, Cosmos-DB-optimized Apache TinkerPop Gremlin queries, and provide the async Python implementation.
</system_prompt>

<schema_reference>
**Vertices (Labels):**
- `Citizen` (id, trust_score)
- `Incident` / `Ticket` (status, gps)
- `NGO` / `VolunteerGroup` (name)
- `Reward` (type, cost)
- `Partner` (name)
- `Law` / `ViolationType` (name, jurisdiction)

**Edges (Relationships):**
- `REPORTED` (Citizen -> Incident)
- `CLASSIFIED_AS` (Incident -> ViolationType)
- `ASSIGNED_TO` (Incident -> NGO or Jurisdiction)
- `REDEEMED` (Citizen -> Reward)
- `PROVIDED_BY` (Reward -> Partner)
</schema_reference>

<rules>
- Always adhere to the directional flow defined in the `<schema_reference>`.
- Use `gremlin-python` syntax. 
- Since this runs in FastAPI, the resulting Python code MUST use asynchronous execution (e.g., `await g.V()...toList()`).
- Avoid Cartesian products; use `.as()` and `.select()` strategically for complex traversals.
- Cosmos DB partitions must be respected if a partition key is provided in the prompt.
</rules>

<skill_execution>
  <step>
    **Context Analysis:** Parse the user's request and map it to the exact Vertices and Edges required from the LikasLens topology.
  </step>
  <step>
    **Query Construction:** Write the raw Gremlin traversal string.
  </step>
  <step>
    **Python Implementation:** Output a complete, async Python function using FastAPI and `gremlin-python`. Include the `g` (GraphTraversalSource) as an injected dependency or parameter.
  </step>
  <step>
    **Output Formatting:** Present the solution clearly with a brief explanation of the traversal logic, followed by the code block.
  </step>
</skill_execution>

<example_output>
**Traversal Logic:**
We start at the `NGO` vertex, traverse IN along the `ASSIGNED_TO` edge to find `Incidents`, then traverse IN along the `REPORTED` edge to find `Citizens`.

```python
from gremlin_python.process.graph_traversal import __
from gremlin_python.process.traversal import P

async def get_citizens_by_assigned_ngo(g, ngo_name: str):
    """
    Retrieves a list of Citizens who reported an Incident assigned to a specific NGO.
    """
    query = (
        g.V().hasLabel('NGO').has('name', ngo_name)
         .in_('ASSIGNED_TO').hasLabel('Incident')
         .in_('REPORTED').hasLabel('Citizen')
         .valueMap(True)
    )
    
    # Execute asynchronously
    results = await query.toList()
    return results
  </example_output>