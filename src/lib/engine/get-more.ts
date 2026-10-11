import type {
  Catalogue,
  GoalCategory,
  ModelClassId,
  Tool,
} from "@/lib/schemas/catalogue";
import type { GetMore, ModelGuidance, NamedModels } from "@/lib/schemas/plan";

/**
 * The model names a tool's page gives for the classes this job calls for.
 * Names are shown only when the record carries the page and the day it was
 * read, which the schema requires together with the names.
 */
function namedModels(
  tool: Tool,
  classIds: readonly ModelClassId[],
): GetMore["models"] {
  const { models, modelsUrl, modelsCheckedOn } = tool;
  if (!models?.length || !modelsUrl || !modelsCheckedOn) return null;

  const wanted =
    classIds.length > 0 ? classIds : models.map((m) => m.modelClass);
  const classes: NamedModels[] = [...new Set(wanted)].flatMap((modelClass) => {
    const names = models
      .filter((model) => model.modelClass === modelClass)
      .map((model) => model.name);
    return names.length > 0 ? [{ modelClass, names }] : [];
  });
  if (classes.length === 0) return null;
  return { classes, checkedOn: modelsCheckedOn, url: modelsUrl };
}

function addOnsFor(
  tool: Tool,
  category: GoalCategory | null,
  data: Catalogue,
): GetMore["addOns"] {
  if (!category) return [];
  return tool.enhancedBy
    .filter((entry) => entry.categories.includes(category))
    .flatMap((entry) => {
      const addOn = data.tools.find(
        (candidate) => candidate.id === entry.toolId,
      );
      if (!addOn) return [];
      return [
        {
          toolId: addOn.id,
          toolName: addOn.name,
          kind: addOn.kind,
          officialUrl: addOn.officialUrl,
          getIt: addOn.getIt ?? null,
        },
      ];
    });
}

/**
 * What the "Get more from <tool>" section holds for one card, or null when
 * the tool is not an AI tool or has recorded nothing for it. The starter
 * prompt is not part of this: it belongs to the goal, not the tool.
 */
export function buildGetMore(
  tool: Tool,
  guidance: ModelGuidance | null,
  category: GoalCategory | null,
  data: Catalogue,
): GetMore | null {
  if (tool.kind !== "ai-tool") return null;

  // Without goal-specific guidance, give the plain advice for planning and drafts.
  const classIds: ModelClassId[] = guidance
    ? guidance.steps.map((step) => step.modelClass)
    : ["deep-reasoning", "fast-and-cheap"];
  const uses = new Map<ModelClassId, string>(
    guidance
      ? guidance.steps.map((step) => [step.modelClass, step.useFor])
      : data.modelClasses.map((c) => [c.id, c.useFor]),
  );
  const classAdvice = [...new Set(classIds)].flatMap((modelClass) => {
    const useFor = uses.get(modelClass);
    return useFor ? [{ modelClass, useFor }] : [];
  });

  const getMore: GetMore = {
    models: namedModels(tool, classIds),
    classAdvice,
    tips: tool.tips.map((tip) => ({
      text: tip.text,
      sourceUrl: tip.sourceUrl ?? null,
    })),
    tipsCheckedOn: tool.tipsCheckedOn ?? null,
    addOns: addOnsFor(tool, category, data),
    freePlanTips: tool.freePlanTips,
  };

  const hasToolData =
    getMore.models !== null ||
    getMore.tips.length > 0 ||
    getMore.addOns.length > 0 ||
    getMore.freePlanTips.length > 0;
  return hasToolData ? getMore : null;
}
