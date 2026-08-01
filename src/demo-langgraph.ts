import { processFloorPlanWithLangGraph } from './lib/langGraphEngine';

async function runDemo() {
  console.log('======================================================');
  console.log('       LANGGRAPH WORKFLOW VERIFICATION DEMO          ');
  console.log('======================================================\n');

  // Path A: Happy Path
  console.log('--- [PATH A] Executing Happy Path ---');
  const happyResult = await processFloorPlanWithLangGraph('', 'mock:happy');
  console.log('\n[PATH A OUTPUT] Generated Layout:');
  console.log(`Rooms detected: ${happyResult.rooms.map((r: any) => r.name).join(', ')}`);
  console.log(`Walls generated: ${happyResult.walls.length}`);
  console.log(`Furniture items placed: ${happyResult.furniture.length}`);
  console.log('------------------------------------------------------\n');

  // Path B: Fallback Path
  console.log('--- [PATH B] Executing Fallback Path (Ambiguous/Low-Confidence Input) ---');
  const fallbackResult = await processFloorPlanWithLangGraph('', 'mock:fallback');
  console.log('\n[PATH B OUTPUT] Degraded/Safe Layout:');
  console.log(`Rooms detected: ${fallbackResult.rooms.map((r: any) => r.name).join(', ')}`);
  console.log(`Walls generated: ${fallbackResult.walls.length}`);
  console.log(`Furniture items placed: ${fallbackResult.furniture.length}`);
  console.log('------------------------------------------------------\n');

  // Path C: Replanning Path
  console.log('--- [PATH C] Executing Replanning Loop (Self-Correcting Layout) ---');
  const replanResult = await processFloorPlanWithLangGraph('', 'mock:replan');
  console.log('\n[PATH C OUTPUT] Corrected Layout:');
  console.log(`Rooms detected: ${replanResult.rooms.map((r: any) => r.name).join(', ')}`);
  console.log(`Walls generated: ${replanResult.walls.length}`);
  console.log(`Furniture items placed: ${replanResult.furniture.length}`);
  console.log('======================================================');
}

runDemo().catch(err => {
  console.error('Demo execution error:', err);
});
