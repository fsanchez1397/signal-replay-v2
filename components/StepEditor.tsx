"use client";

import { type WorkflowStep } from "@/lib/schemas/workflow";

interface StepEditorProps {
  step: WorkflowStep;
  onChange: (step: WorkflowStep) => void;
}

export function StepEditor({ step, onChange }: StepEditorProps) {
  const handleTypeChange = (type: WorkflowStep["type"]) => {
    // Reset step with new type
    const baseStep = {
      id: step.id,
      type,
      timeout: 5000,
      screenshot: false,
    };

    let newStep: WorkflowStep;

    switch (type) {
      case "goto":
        newStep = { ...baseStep, type: "goto", url: "", waitUntil: "load" };
        break;
      case "click":
        newStep = {
          ...baseStep,
          type: "click",
          selector: { type: "css", value: "" },
          waitForNavigation: false,
          clickCount: 1,
        };
        break;
      case "type":
        newStep = {
          ...baseStep,
          type: "type",
          selector: { type: "css", value: "" },
          text: "",
          clearFirst: true,
          pressEnter: false,
        };
        break;
      case "wait":
        newStep = { ...baseStep, type: "wait", waitType: "time", value: 1000 };
        break;
      case "scroll":
        newStep = {
          ...baseStep,
          type: "scroll",
          direction: "down",
          amount: 500,
        };
        break;
      case "scrape":
        newStep = {
          ...baseStep,
          type: "scrape",
          selector: { type: "css", value: "" },
          multiple: false,
          storeAs: "",
        };
        break;
      default:
        newStep = {
          ...baseStep,
          type: "wait",
          waitType: "time",
          value: 1000,
        } as WorkflowStep;
    }

    onChange(newStep);
  };

  return (
    <div className="space-y-4">
      {/* Step Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Step Type
        </label>
        <select
          value={step.type}
          onChange={(e) =>
            handleTypeChange(e.target.value as WorkflowStep["type"])
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
        >
          <option value="goto">Navigate (goto)</option>
          <option value="click">Click</option>
          <option value="type">Type Text</option>
          <option value="wait">Wait</option>
          <option value="scroll">Scroll</option>
          <option value="scrape">Scrape Data</option>
        </select>
      </div>

      {/* Type-specific fields */}
      {step.type === "goto" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            type="url"
            value={step.url}
            onChange={(e) => onChange({ ...step, url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://example.com"
          />
        </div>
      )}

      {step.type === "click" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CSS Selector
          </label>
          <input
            type="text"
            value={step.selector.value}
            onChange={(e) =>
              onChange({
                ...step,
                selector: { ...step.selector, value: e.target.value },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="button.submit"
          />
        </div>
      )}

      {step.type === "type" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CSS Selector
            </label>
            <input
              type="text"
              value={step.selector.value}
              onChange={(e) =>
                onChange({
                  ...step,
                  selector: { ...step.selector, value: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="input[name='email']"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text to Type
            </label>
            <input
              type="text"
              value={step.text}
              onChange={(e) => onChange({ ...step, text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter text here"
            />
          </div>
        </>
      )}

      {step.type === "wait" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wait Duration (ms)
          </label>
          <input
            type="number"
            value={typeof step.value === "number" ? step.value : 1000}
            onChange={(e) =>
              onChange({ ...step, value: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            min="0"
          />
        </div>
      )}

      {step.type === "scroll" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction
            </label>
            <select
              value={step.direction}
              onChange={(e) =>
                onChange({ ...step, direction: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="top">To Top</option>
              <option value="bottom">To Bottom</option>
            </select>
          </div>
          {(step.direction === "up" || step.direction === "down") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (pixels)
              </label>
              <input
                type="number"
                value={step.amount || 500}
                onChange={(e) =>
                  onChange({ ...step, amount: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}
        </>
      )}

      {step.type === "scrape" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CSS Selector
            </label>
            <input
              type="text"
              value={step.selector.value}
              onChange={(e) =>
                onChange({
                  ...step,
                  selector: { ...step.selector, value: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder=".product-title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store As (variable name)
            </label>
            <input
              type="text"
              value={step.storeAs}
              onChange={(e) => onChange({ ...step, storeAs: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="productTitle"
            />
          </div>
        </>
      )}

      {/* Common fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={step.description || ""}
          onChange={(e) => onChange({ ...step, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="What does this step do?"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={step.screenshot}
            onChange={(e) =>
              onChange({ ...step, screenshot: e.target.checked })
            }
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Take Screenshot</span>
        </label>
      </div>
    </div>
  );
}
