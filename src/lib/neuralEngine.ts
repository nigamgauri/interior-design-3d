import { processFloorPlanWithLangGraph } from './langGraphEngine';

export const processFloorPlan = async (imageUrl: string) => {
  console.log(' [NEURAL_ENGINE] Starting reconstruction via LangGraph for:', imageUrl);
  return await processFloorPlanWithLangGraph(imageUrl);
};
