/**
 * TeapotControls Component
 * HTML overlay 방식 GUI 컨트롤 패널
 */
import { SHADING_MODE_OPTIONS, TESSELLATION_RANGE } from '../constants';

import type { TeapotConfig, ShadingMode } from '../types';

interface TeapotControlsProps {
    config: TeapotConfig;
    onConfigChange: (config: Partial<TeapotConfig>) => void;
}

export function TeapotControls({
    config,
    onConfigChange,
}: TeapotControlsProps) {
    const handleTessellationChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        onConfigChange({ tessellation: Number(e.target.value) });
    };

    const handleShadingModeChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        onConfigChange({ shadingMode: e.target.value as ShadingMode });
    };

    const handleCheckboxChange =
        (key: keyof TeapotConfig) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onConfigChange({ [key]: e.target.checked });
        };

    return (
        <div className="absolute top-4 right-4 z-10 w-64 space-y-4 rounded-lg bg-white/95 p-4 shadow-lg backdrop-blur-sm">
            <h3 className="border-b pb-2 text-sm font-semibold text-gray-800">
                Teapot Controls
            </h3>

            {/* Tessellation */}
            <div className="space-y-1">
                <label
                    htmlFor="tessellation"
                    className="block text-xs font-medium text-gray-600"
                >
                    Tessellation: {config.tessellation}
                </label>
                <input
                    id="tessellation"
                    type="range"
                    min={TESSELLATION_RANGE.min}
                    max={TESSELLATION_RANGE.max}
                    step={TESSELLATION_RANGE.step}
                    value={config.tessellation}
                    onChange={handleTessellationChange}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
                    aria-label="Tessellation level"
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>{TESSELLATION_RANGE.min}</span>
                    <span>{TESSELLATION_RANGE.max}</span>
                </div>
            </div>

            {/* Shading Mode */}
            <div className="space-y-1">
                <label
                    htmlFor="shading-mode"
                    className="block text-xs font-medium text-gray-600"
                >
                    Shading Mode
                </label>
                <select
                    id="shading-mode"
                    value={config.shadingMode}
                    onChange={handleShadingModeChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="Select shading mode"
                >
                    {SHADING_MODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Display Options */}
            <div className="space-y-2">
                <span className="block text-xs font-medium text-gray-600">
                    Display
                </span>
                <div className="space-y-1">
                    <label className="flex cursor-pointer items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={config.showLid}
                            onChange={handleCheckboxChange('showLid')}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Lid</span>
                    </label>
                    <label className="flex cursor-pointer items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={config.showBody}
                            onChange={handleCheckboxChange('showBody')}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Body</span>
                    </label>
                    <label className="flex cursor-pointer items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={config.showBottom}
                            onChange={handleCheckboxChange('showBottom')}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Bottom</span>
                    </label>
                </div>
            </div>

            {/* Auto Rotate */}
            <div className="border-t pt-2">
                <label className="flex cursor-pointer items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={config.autoRotate}
                        onChange={handleCheckboxChange('autoRotate')}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Auto Rotate</span>
                </label>
            </div>
        </div>
    );
}
