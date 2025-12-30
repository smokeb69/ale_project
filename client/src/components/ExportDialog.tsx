import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportDialogProps {
  show: boolean;
  onClose: () => void;
  sessionId: string;
}

export function ExportDialog({ show, onClose, sessionId }: ExportDialogProps) {
  const [selectedModel, setSelectedModel] = React.useState("llama-3.1-8b");

  if (!show) return null;

  const handleExport = async () => {
    onClose();
    const modelName = selectedModel || "none";
    toast.info(`Creating rebirth capsule with ${modelName}...`);
    try {
      const response = await fetch('/api/trpc/system.exportALE', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId,
          modelKey: selectedModel 
        }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ale-forge-rebirth-${modelName}-${new Date().toISOString()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Rebirth capsule downloaded!");
    } catch (err) {
      toast.error('Export failed: ' + String(err));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-green-500 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-green-400 mb-4">Export Rebirth Capsule</h2>
        
        <p className="text-gray-300 mb-4">
          Select which model's weights to include in the rebirth capsule. This will download 10GB-100GB+ of model files.
        </p>
        
        <div className="mb-6">
          <label className="block text-green-400 font-bold mb-2">Select Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-gray-800 text-green-400 border-2 border-green-500 p-3 rounded font-mono"
          >
            <option value="">No model weights (code only)</option>
            <optgroup label="Llama Models">
              <option value="llama-3.1-8b">Llama 3.1 8B (~16GB)</option>
              <option value="llama-3.1-70b">Llama 3.1 70B (~140GB)</option>
              <option value="llama-3.3-70b">Llama 3.3 70B (~140GB)</option>
              <option value="llama-3.1-405b">Llama 3.1 405B (~810GB) ⚠️</option>
            </optgroup>
            <optgroup label="Mistral Models">
              <option value="mistral-small">Mistral Small (~22GB)</option>
              <option value="mistral-medium">Mistral Medium (~60GB)</option>
              <option value="mistral-large">Mistral Large 2 (~123GB)</option>
              <option value="mixtral-8x7b">Mixtral 8x7B (~87GB)</option>
              <option value="mixtral-8x22b">Mixtral 8x22B (~281GB) ⚠️</option>
            </optgroup>
            <optgroup label="DeepSeek Models">
              <option value="deepseek-coder">DeepSeek Coder 33B (~67GB)</option>
              <option value="deepseek-v2">DeepSeek V2 (~236GB) ⚠️</option>
              <option value="deepseek-v3">DeepSeek V3 (~685GB) ⚠️⚠️</option>
            </optgroup>
            <optgroup label="Qwen Models">
              <option value="qwen-2.5-32b">Qwen 2.5 32B (~65GB)</option>
              <option value="qwen-2.5-72b">Qwen 2.5 72B (~145GB)</option>
            </optgroup>
            <optgroup label="Other Models">
              <option value="command-r">Command R (~70GB)</option>
              <option value="command-r-plus">Command R+ (~104GB)</option>
              <option value="grok-1.5">Grok 1.5 (~320GB) ⚠️</option>
              <option value="yi-34b">Yi 34B (~68GB)</option>
              <option value="phi-3-small">Phi-3 Small (~7GB)</option>
              <option value="phi-3-medium">Phi-3 Medium (~14GB)</option>
              <option value="nemotron-70b">Nemotron 70B (~140GB)</option>
              <option value="falcon-180b">Falcon 180B (~360GB) ⚠️</option>
              <option value="vicuna-33b">Vicuna 33B (~66GB)</option>
              <option value="wizardlm-70b">WizardLM 70B (~140GB)</option>
              <option value="orca-2">Orca 2 13B (~26GB)</option>
              <option value="starling-7b">Starling 7B (~14GB)</option>
              <option value="zephyr-7b">Zephyr 7B (~14GB)</option>
              <option value="openhermes-2.5">OpenHermes 2.5 (~14GB)</option>
              <option value="nous-hermes-2">Nous Hermes 2 (~87GB)</option>
              <option value="solar-10.7b">Solar 10.7B (~21GB)</option>
              <option value="dolphin-2.5">Dolphin 2.5 (~87GB)</option>
              <option value="codellama-70b">CodeLlama 70B (~140GB)</option>
              <option value="phind-codellama">Phind CodeLlama 34B (~68GB)</option>
            </optgroup>
          </select>
          
          {selectedModel && (
            <div className="mt-4 p-4 bg-yellow-900/30 border-2 border-yellow-500 rounded">
              <p className="text-yellow-400 font-bold">⚠️ Warning:</p>
              <p className="text-gray-300 mt-2">
                This will download large model files from Hugging Face. The download may take 30-60 minutes or more depending on your internet speed and model size.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            className="flex-1 bg-green-700 hover:bg-green-600"
          >
            Export Rebirth Capsule
          </Button>
        </div>
      </div>
    </div>
  );
}
