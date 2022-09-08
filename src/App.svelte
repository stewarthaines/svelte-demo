<script lang="ts">
  import { get, set } from 'idb-keyval'
  import { onMount } from 'svelte'
  import { newProjectFromTemplate } from './lib/Project'

  let project
  let fileHandle
  let filename
  let fileData
  const CURRENT_PICKLET = 'current-picklet-filehandle'

  onMount(async () => {
    if (typeof(window.showOpenFilePicker) == 'undefined') {
      // redirect
      console.error('should have navigated away to browser.svelte but didn\'t')
    }
    fileHandle = await get(CURRENT_PICKLET)
    if (fileHandle) {
      console.log(`${fileHandle} loaded from idb`)
      filename = fileHandle.name
    }
  })

  async function reopenProject() {
    const writeable = await verifyPermission(fileHandle, true)
    if (writeable) {
      fileData = await fileHandle.getFile()
      const projectData = await fileData.text();
      console.log(projectData)
      project = JSON.parse(projectData)
    }
  }

  async function loadProject(handle) {
    fileData = await handle.getFile()
    const projectData = await fileData.text();
    console.log(projectData)
    project = JSON.parse(projectData)
  }

  async function chooseProjectFile() {
    const [fileHandle] = await window.showOpenFilePicker()
    loadProject(fileHandle)
    // persist the handle so we can try opening on page refresh
    set(CURRENT_PICKLET, fileHandle);
  }

  function createProject() {
    project = newProjectFromTemplate()
  }

  async function saveProjectAs() {
    let fileHandle = await window.showSaveFilePicker({
      suggestedName: 'picklet.json'
    })
    if (fileHandle.kind === 'file') {
      filename = fileHandle.name

      // localStorage.setItem('current-picklet-file', fileHandle)
      const writable = await fileHandle.createWritable();

      // Write the contents of the file to the stream.
      await writable.write(JSON.stringify(project));

      // Close the file and write the contents to disk.
      await writable.close();

      // persist the handle so we can try opening on page refresh
      set(CURRENT_PICKLET, fileHandle);
    }
  }

async function verifyPermission(fileHandle, withWrite) {
  const opts = {};
  if (withWrite) {
    opts.mode = 'readwrite';
  }

  // Check if we already have permission, if so, return true.
  if (await fileHandle.queryPermission(opts) === 'granted') {
    return true;
  }

  // Request permission to the file, if the user grants permission, return true.
  if (await fileHandle.requestPermission(opts) === 'granted') {
    return true;
  }

  // The user did not grant permission, return false.
  return false;
}
</script>

<main>
  <h1>Epub &amp; Picklets</h1>

  <p>
  {#if project}Current project: {project.name}{/if}
  {#if filename && !project}<button on:click={reopenProject}>Reopen {filename}</button>{/if}
  </p>

  <p>
  Anything at all.
  </p>
  <button on:click={chooseProjectFile}>Open project</button>
  <button on:click={createProject}>New project</button>
  <button on:click={saveProjectAs}>Save project as</button>

  <p>
  This application is public because it is hosted on github pages and doesn't cost me anything. If you have stumbled across it and are curious about it feel free get in touch with me. Contact details at <a href="https://github.com/stewarthaines">github</a>.
  </p>
</main>

<style>
</style>