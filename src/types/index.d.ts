export {};

declare global {
  interface Window {
    showOpenFilePicker: CallableFunction;
    showSaveFilePicker: CallableFunction;
    showDirectoryPicker: CallableFunction;
  }
}