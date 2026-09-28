import { describe, it, expect } from 'vitest';
import { QuantizationEngine } from '../src/core/quantizationEngine';

describe('QuantizationEngine', () => {
  describe('analyzeModelSavings', () => {
    it('calculates accurate savings for 1B parameters model', () => {
      const savings = QuantizationEngine.analyzeModelSavings(1.0);
      expect(savings.originalParams).toBe(1.0);
      expect(savings.originalSizeFP16MB).toBe(2000);
      expect(savings.quantizedSize1BitMB).toBe(205);
      expect(savings.reductionPercentage).toBeGreaterThan(85);
      expect(savings.energyReductionRatio).toBe(71.4);
      expect(savings.ternaryDistribution.minusOnePct).toBe(34.2);
    });

    it('calculates accurate savings for sub-0.5B and >0.5B models', () => {
      const savings7B = QuantizationEngine.analyzeModelSavings(7.0);
      expect(savings7B.originalSizeFP16MB).toBe(14000);
      expect(savings7B.quantizedSize1BitMB).toBe(1435);
      expect(savings7B.reductionPercentage).toBeCloseTo(89.8, 1);
    });
  });

  describe('quantizeTensorSlice', () => {
    it('converts continuous float weights into ternary values {-1, 0, 1}', () => {
      const weights = [1.2, -0.9, 0.05, 0.8, -1.1, -0.02];
      const result = QuantizationEngine.quantizeTensorSlice(weights);

      expect(result.gamma).toBeGreaterThan(0);
      expect(result.quantized.length).toBe(weights.length);

      // Verify all elements belong to {-1, 0, 1}
      for (const val of result.quantized) {
        expect([-1, 0, 1]).toContain(val);
      }

      // Check distribution sum
      const totalPct =
        result.distribution.neg +
        result.distribution.zero +
        result.distribution.pos;
      expect(Math.round(totalPct)).toBe(100);
    });

    it('handles empty weights array gracefully', () => {
      const result = QuantizationEngine.quantizeTensorSlice([]);
      expect(result.quantized).toEqual([]);
      expect(result.gamma).toBe(0);
      expect(result.distribution.zero).toBe(0);
    });

    it('handles custom epsilon value', () => {
      const weights = [0.5, -0.5, 0.0];
      const result = QuantizationEngine.quantizeTensorSlice(weights, 1e-3);
      expect(result.quantized).toEqual([1, -1, 0]);
    });
  });

  describe('generatePyTorchBitLinearCode', () => {
    it('produces valid PyTorch module code with given model name', () => {
      const code = QuantizationEngine.generatePyTorchBitLinearCode('Llama-3.2-1B');
      expect(code).toContain('VUC 1-Bit BitLinear Adapter Engine for Llama-3.2-1B');
      expect(code).toContain('class VucBitLinear(nn.Linear):');
      expect(code).toContain('weight_quant_bitnet');
      expect(code).toContain('activation_quant_int8');
      expect(code).toContain('Straight-Through Estimator');
    });
  });
});
