/* Newsign Labs — WebGL capability check shared by the motion layer and the standalone pages */
/** True when WebGL runs on a real GPU. Software renderers (no GPU, blocklisted drivers) draw
    every frame on the CPU and freeze the page, so those visitors get the CSS versions. */
export function hasFastWebGL() {
  try {
    const gl = document.createElement('canvas').getContext('webgl', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}
