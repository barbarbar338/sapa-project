import { atom } from "jotai";

// Signal data atoms
export const micDataAtom = atom([]);
export const filteredMicDataAtom = atom([]);

// FFT data atoms
export const spectrumDataAtom = atom([]);
export const filteredSpectrumDataAtom = atom([]);

// FFT label atoms
export const labelsAtom = atom([]);
export const filteredLabelsAtom = atom([]);

// FFT label max atoms
export const labelMaxAtom = atom(10);
export const filteredLabelMaxAtom = atom(10);

// Bandpass filter atoms
export const lowPassAtom = atom(0);
export const highPassAtom = atom(0);

// BPM atom
export const bpmAtom = atom(0);
