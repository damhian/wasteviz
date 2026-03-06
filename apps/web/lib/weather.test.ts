import { describe, it, expect } from 'vitest';
import { getWmoCondition } from './weather';

describe('getWmoCondition', () => {
  it('should return "Clear Sky" for code 0', () => {
    expect(getWmoCondition(0)).toBe("Clear Sky");
  });

  it('should return "Partly Cloudy" for codes 1-3', () => {
    expect(getWmoCondition(1)).toBe("Partly Cloudy");
    expect(getWmoCondition(2)).toBe("Partly Cloudy");
    expect(getWmoCondition(3)).toBe("Partly Cloudy");
  });

  it('should return "Fog" for codes 45-48', () => {
    expect(getWmoCondition(45)).toBe("Fog");
    expect(getWmoCondition(48)).toBe("Fog");
  });

  it('should return "Rain" for codes 51-67', () => {
    expect(getWmoCondition(51)).toBe("Rain");
    expect(getWmoCondition(67)).toBe("Rain");
  });

  it('should return "Snow" for codes 71-77', () => {
    expect(getWmoCondition(71)).toBe("Snow");
    expect(getWmoCondition(77)).toBe("Snow");
  });

  it('should return "Thunderstorm" for codes 95-99', () => {
    expect(getWmoCondition(95)).toBe("Thunderstorm");
    expect(getWmoCondition(99)).toBe("Thunderstorm");
  });

  it('should return "Unknown" for unmapped codes', () => {
    expect(getWmoCondition(999)).toBe("Unknown");
    expect(getWmoCondition(-1)).toBe("Unknown");
  });
});
