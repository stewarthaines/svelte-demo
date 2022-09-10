<script lang="ts">
  import { get, set } from 'idb-keyval'
  import { onMount } from 'svelte'
  import { newProjectFromTemplate } from './lib/Project'

  let project
  let fileHandle
  let filename
  let fileData
  let assets = []
  let value = 0.01
  const CURRENT_PICKLET = 'current-picklet-filehandle'
  let svg
  // let animate

  $: svg && svg.setCurrentTime(value)

  onMount(async () => {
    svg.pauseAnimations()
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

  async function* getFilesRecursively (directoryHandle, entry) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      if (file !== null) {
          yield file;
      }
    } else if (entry.kind === 'directory') {
      for await (const handle of entry.values()) {
        yield* getFilesRecursively(directoryHandle, handle);
      }
    }
  }

  async function openDirectory() {
    const directoryHandle = await window.showDirectoryPicker();
    for await (const file of getFilesRecursively(directoryHandle, directoryHandle)) {
      // const projectData = await file.text()
      // console.log(`${file.name}: ${projectData}`)
      assets = assets.concat(file)
      console.log(file)
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

  <!-- <img src="/vite.svg" alt="" width="200px"> -->
<svg
   bind:this={svg}
   width="500"
   viewBox="0 0 270.93333 203.2"
   version="1.1"
   id="svg5"
   inkscape:version="1.1 (c4e8f9e, 2021-05-24)"
   sodipodi:docname="drawing.svg"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <path
     style="fill:none;fill-opacity:1;stroke:#c60000;stroke-width:0.264583px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
     d="m 153.46845,98.297515 c 0,0 93.63518,-95.1947901 93.63518,-37.298663 0,57.896118 -93.63518,37.298663 -93.63518,37.298663 z"
     id="curve2"
     inkscape:label="curve2"
     sodipodi:nodetypes="czc">
    <animate begin="0s" keySplines="0.4, 0, 0.1, 1" keyTimes="0; 1" calcMode="spline" attributeName="d" dur="1s" fill="freeze" to="m 153.46845,98.297515 c 0,0 93.63518,-58.673184 93.63518,-0.777057 0,57.896122 -93.63518,0.777057 -93.63518,0.777057 z" />
  </path>
</svg>
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
  <button on:click={openDirectory}>Open directory</button>

  <ul>
  {#each assets as asset}<li>{asset.name}</li>{/each}
  </ul>

  

  <input type="range" min=0.01 max=1 bind:value step=0.01>
  <br/> {value}

  <p>
  This application is public because it is hosted on github pages. If you have stumbled across it and are curious about it feel free get in touch with me. Contact details at <a href="https://github.com/stewarthaines">github</a>.
  </p>

</main>

<style>
</style>