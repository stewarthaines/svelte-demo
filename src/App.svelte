<script lang="ts">
  import { get, set } from 'idb-keyval'
  import { onMount } from 'svelte'
  import { newProjectFromTemplate } from './lib/Project'
  import Tree from './lib/Tree.svelte'

  let project
  let fileHandle
  let directoryHandle
  let filename
  let fileData
  let group
  let svgDoc
  let svgText
  let assets = []
  let value = 0.001
  const CURRENT_PICKLET = 'current-picklet-filehandle'
  const CURRENT_DIRECTORY = 'current-directoryhandle'
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
    directoryHandle = await window.showDirectoryPicker();
    assets = []
    for await (const file of getFilesRecursively(directoryHandle, directoryHandle)) {
      assets = assets.concat({file, error: ''})
    }
    if (assets.length > 0) {
      set(CURRENT_DIRECTORY, directoryHandle);
    }
  }

  async function refreshDirectory() {
    directoryHandle = await get(CURRENT_DIRECTORY)
    await directoryHandle.requestPermission()
    assets = []
    for await (const file of getFilesRecursively(directoryHandle, directoryHandle)) {
      assets = assets.concat({file, error: ''})
    }
  }

  async function parseSvg(asset: {file: File, error: string}) {
    let filename = asset.file.name
    await refreshDirectory()
    const parser = new DOMParser()
    // try to get a filename matching the clicked file...
    let refreshedAsset = asset
    assets.forEach((value) => {
      if (value.file.name == filename) {
        console.log(`matched ${asset.file.lastModified} on filename: ${filename}`)
        refreshedAsset = value
      }
    })
    svgText = await refreshedAsset.file.text()
    svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    // group = svgDoc.querySelector('g')
    // svg.appendChild(group)
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
  <h1>SVG &amp; Epub &amp; Picklets</h1>

  <!-- <img src="/vite.svg" alt="" width="200px"> -->
<svg
   bind:this={svg}
   width="300"
   height="300"
   viewBox="0 0 132.29167 132.29167"
   version="1.1"
   id="svg5"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
    <path
      style="fill:none;fill-opacity:1;stroke:#2b8bd1;stroke-width:0.79375;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;stroke-miterlimit:4;stroke-dasharray:none"
      d="m 12.821414,64.884131 c 0,0 93.635176,-95.19479 93.635176,-37.298663 0,57.896118 -93.635176,37.298663 -93.635176,37.298663 z"
      id="curve2">
      <animate begin="0s" keySplines="0.4, 0, 0.1, 1" keyTimes="0; 1" calcMode="spline" attributeName="d" dur="1s" fill="freeze" to="m 12.821414,64.884131 c 0,0 93.635176,-58.6731843 93.635176,-0.777057 0,57.896126 -93.635176,0.777057 -93.635176,0.777057 z" />
    </path>
  </svg>
  <p>
  {#if project}Current project: {project.name}{/if}
  {#if filename && !project}<button on:click={reopenProject}>Reopen {filename}</button>{/if}
  </p>
  <div class="tree">
    {#if svgDoc}<Tree node={svgDoc}/>{/if}
  </div>
  <p>
  Anything at all.
  </p>
  <button on:click={chooseProjectFile}>Open project</button>
  <button on:click={createProject}>New project</button>
  <button on:click={saveProjectAs}>Save project as</button>
  <button on:click={openDirectory}>Open directory</button>
  <button on:click={refreshDirectory}>Refresh</button>

  <ul>
  <!-- svelte-ignore a11y-missing-attribute -->
  {#each assets as asset}<li><a on:click={() => parseSvg(asset)}>{asset.file.name}</a> {asset.file.lastModified} {asset.error}</li>{/each}
  </ul>

  <input class="slider" type="range" min=0.001 max=1 bind:value step=0.001>
  <br/> {value}

  <p>
  This application is public because it is hosted on github pages.<br>
  If you have stumbled across it and are curious about it feel free get in touch with me.<br>
  Contact details at <a href="https://github.com/stewarthaines">github</a>.
  </p>

</main>

<style>
.tree {
  position: absolute;
  top: 0;
  background-color: #ccc;
  text-align: left;
}
input[type=range] {
  pointer-events: none;
  direction: rtl;
  -webkit-appearance: none;
  width: 100%;
  height: 48px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 5px;
}
input[type=range]:focus-visible {
  outline-style: none;
}
input[type=range]::-webkit-slider-runnable-track {
  -webkit-appearance: initial;
}
input[type=range]::-webkit-slider-thumb {
  pointer-events:auto;
  -webkit-appearance: none;
  appearance: none;
  width: 64px;
  height: 48px;
  border-radius: 10px;
  cursor: pointer;
  background-color: red;
}
</style>