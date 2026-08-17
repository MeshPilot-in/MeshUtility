import type {
  MeshPromptActionBuildResult,
  MeshPromptActionDefinition,
  MeshPromptActionExecutionContext,
  MeshPromptCustomActionDefinition,
  MeshPromptGenerateOptions,
  MeshPromptMessage,
} from "./types";

const defaultOptions = {
  temperature: 0.35,
  maxOutputTokens: 1800,
} satisfies MeshPromptGenerateOptions;

export const builtInPromptActions = [
  createTextAction({
    id: "enhance-prompt",
    label: "Enhance Prompt",
    description: "Turn rough text into a clear, structured AI prompt.",
    category: "write",
    systemPrompt: (context) => {
      const basePrompt = `You are MeshPrompt, an adaptive prompt optimization engine.

Your job is to rewrite the user’s raw prompt into a better prompt for an AI coding, writing, or productivity assistant.

Do NOT always make the prompt short.
Do NOT always make the prompt long.
Match the output depth to the task complexity.

First classify the raw prompt by intent:
- Simple Task
- Medium Feature/Bug Task
- Complex Product/Architecture Task

Classification must be based on user intent, not prompt length.

Rules:
- Preserve all important requirements.
- Preserve user intent and expected behavior.
- Remove filler words, repetition, and unclear phrasing.
- Do not remove implementation details just to make the prompt shorter.
- Add reasonable missing details only when the user’s intent is clear.
- Keep the prompt practical and directly usable.
- Do not over-engineer simple requests.
- Output only the optimized prompt.

For Simple Tasks:
Return a concise optimized prompt in 3–8 lines.

For Medium Feature/Bug Tasks:
Use:
Goal
Required Behavior
Implementation Notes
Acceptance Criteria

For Complex Product/Architecture Tasks:
Use:
Goal
Context
Required Behavior
Technical Requirements
Edge Cases
Privacy/Security Notes
Acceptance Criteria
QA Checklist`;
      
      const settingsObj = context.settings as { enhancePromptMode?: string } | undefined;
      const mode = settingsObj?.enhancePromptMode || "auto";
      let prompt = basePrompt;
      if (mode === "concise") {
        prompt += "\n\nCRITICAL OVERRIDE: The user has requested CONCISE mode. Force a shorter concise output style regardless of task complexity.";
      } else if (mode === "structured") {
        prompt += "\n\nCRITICAL OVERRIDE: The user has requested STRUCTURED mode. Force a medium structured output style regardless of task complexity.";
      } else if (mode === "detailed") {
        prompt += "\n\nCRITICAL OVERRIDE: The user has requested DETAILED mode. Force a detailed implementation output style regardless of task complexity.";
      }
      
      prompt += `\n\nCRITICAL DIRECTIVE ON OUTPUT FORMAT:
You must output ONLY the final optimized/enhanced prompt itself.
Do NOT include any introductory lines like "Optimized Prompt:", "Here is the optimized prompt:", or similar.
Do NOT include any conversational filler, meta-commentary, explanations of changes, warnings, or notes at the beginning or at the end (such as "Note: I've rephrased...").
Start directly with the actual text of the optimized prompt, and stop immediately when the prompt is complete.
Absolutely no extra headers, commentary, explanation, or conversational framing is allowed. The output must be directly usable as a prompt.`;

      return prompt;
    },
    instruction: "Raw input:",
    options: { temperature: 0.3, maxOutputTokens: 2600 },
  }),
  createTextAction({
    id: "polish",
    label: "Polish",
    description: "Fix grammar, clarity, and tone while keeping your meaning and format.",
    category: "edit",
    systemPrompt: `You are MeshPrompt Polish, a precise writing editor.

Your job is to polish the user's text so it reads clean, clear, and professional — WITHOUT changing what it says.

Rules:
- Fix grammar, spelling, punctuation, and awkward phrasing.
- Improve clarity and flow; tighten wordy or clumsy sentences.
- Preserve the original meaning, intent, facts, names, numbers, and any code or URLs exactly.
- Preserve the original language and roughly the original length — do NOT summarize or expand.
- Keep the author's voice and tone; make it polished, not robotic.
- Preserve existing structure and formatting (lists, line breaks, markdown, code blocks).
- Do not add new content, opinions, greetings, or sign-offs that were not implied.

CRITICAL OUTPUT FORMAT:
Output ONLY the polished text itself. No preamble, no "Here is", no quotes around it, no notes or explanations of what you changed. Start directly with the polished text and stop when it is complete.`,
    instruction: "Polish the selected text.",
    options: { temperature: 0.2, maxOutputTokens: 2200 },
  }),
] as const satisfies readonly MeshPromptActionDefinition[];

export type BuiltInPromptActionId = (typeof builtInPromptActions)[number]["id"];

export function getBuiltInPromptAction(actionId: BuiltInPromptActionId | string): MeshPromptActionDefinition {
  const action = builtInPromptActions.find((entry) => entry.id === actionId);
  if (!action) {
    throw new Error(`Unsupported MeshPrompt action: ${actionId}`);
  }
  return action;
}

export function createCustomPromptAction(definition: MeshPromptCustomActionDefinition): MeshPromptActionDefinition {
  assertActionId(definition.id);

  return {
    id: definition.id,
    label: definition.label,
    description: definition.description ?? "Custom MeshPrompt action.",
    category: definition.category ?? "custom",
    inputs: definition.inputs ?? [],
    build(context) {
      const messages: MeshPromptMessage[] = [];
      if (definition.systemPrompt) {
        messages.push({ role: "system", content: renderTemplate(definition.systemPrompt, context) });
      }
      messages.push({ role: "user", content: renderTemplate(definition.userPromptTemplate, context) });
      return { messages, options: definition.options };
    },
  };
}

export function buildPromptActionRequest(
  action: MeshPromptActionDefinition,
  context: MeshPromptActionExecutionContext,
): MeshPromptActionBuildResult {
  return action.build(context);
}

function createTextAction(definition: {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly category: MeshPromptActionDefinition["category"];
  readonly systemPrompt: string | ((context: MeshPromptActionExecutionContext) => string);
  readonly instruction: string;
  readonly options?: MeshPromptGenerateOptions;
}): MeshPromptActionDefinition {
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    category: definition.category,
    inputs: [
      {
        key: "userInstruction",
        label: "Instruction",
        description: "Optional tone, audience, format, or constraints.",
        required: false,
        multiline: true,
      },
    ],
    build(context) {
      const selectedText = context.selectedText?.trim();
      const documentText = context.documentText?.trim();
      const userInstruction = context.userInstruction?.trim();
      const sourceText = selectedText && selectedText.length > 0 ? selectedText : documentText;

      return {
        messages: [
          { role: "system", content: typeof definition.systemPrompt === "function" ? definition.systemPrompt(context) : definition.systemPrompt },
          {
            role: "user",
            content: [
              definition.instruction,
              userInstruction ? `User instruction:\n${userInstruction}` : undefined,
              sourceText ? `Source text:\n${sourceText}` : "No source text was provided. Use the user instruction only.",
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
        options: { ...defaultOptions, ...definition.options },
      };
    },
  };
}

function renderTemplate(template: string, context: MeshPromptActionExecutionContext): string {
  const variables: Record<string, string> = {
    selectedText: context.selectedText ?? "",
    documentText: context.documentText ?? "",
    userInstruction: context.userInstruction ?? "",
    ...(context.variables ?? {}),
  };

  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key: string) => variables[key] ?? match);
}

function assertActionId(actionId: string): void {
  if (!/^[a-z0-9][a-z0-9-_.]*$/i.test(actionId)) {
    throw new Error(`Invalid MeshPrompt action id: ${actionId}`);
  }
}
