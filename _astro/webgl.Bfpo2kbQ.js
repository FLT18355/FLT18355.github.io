import{r as e}from"./dist.CVYB3xFy.js";var t=`#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main(){
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`,n=`#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_source;
uniform vec2 u_dir;
uniform float u_premul; // premultiply on the first pass so transparent edges don't bleed dark
vec4 fetch(vec2 uv){
  vec4 c = texture(u_source, uv);
  if (u_premul > 0.5) c.rgb *= c.a;
  return c;
}
void main(){
  vec4 c = fetch(v_uv) * 0.2042;
  c += (fetch(v_uv + 1.0 * u_dir) + fetch(v_uv - 1.0 * u_dir)) * 0.1801;
  c += (fetch(v_uv + 2.0 * u_dir) + fetch(v_uv - 2.0 * u_dir)) * 0.1240;
  c += (fetch(v_uv + 3.0 * u_dir) + fetch(v_uv - 3.0 * u_dir)) * 0.0663;
  c += (fetch(v_uv + 4.0 * u_dir) + fetch(v_uv - 4.0 * u_dir)) * 0.0276;
  fragColor = c;
}`,r=`#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_src;
uniform sampler2D u_map;
uniform sampler2D u_blurred;
uniform vec2 u_res;
uniform vec2 u_texSize;
uniform vec2 u_coverA;
uniform vec2 u_coverB;
uniform vec2 u_center;
uniform vec2 u_half;
uniform float u_radius;
uniform float u_strength;
uniform float u_chroma;
uniform float u_hasBlur;
uniform float u_spec;
uniform float u_vibrancy;
uniform float u_specLo;
uniform float u_specHi;

vec2 toUV(vec2 px){ return ((px + u_coverB) / u_coverA) / u_texSize; }

// Aave premultiplies u_blurred; unpremultiply back to straight alpha.
vec4 sampleBlur(vec2 uv){
  vec4 b = texture(u_blurred, uv);
  b.rgb = b.a > 1e-4 ? b.rgb / b.a : b.rgb;
  return b;
}

void main(){
  vec2 px = v_uv * u_res;
  vec3 straight = texture(u_src, toUV(px)).rgb;

  // analytical rounded-rect SDF mask (AA via fwidth)
  vec2 p = px - u_center;
  vec2 q = abs(p) - u_half + vec2(u_radius);
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - u_radius;
  float aa = max(fwidth(dist), 1e-4);
  float mask = 1.0 - smoothstep(-aa, aa, dist);
  if (mask < 0.001){ fragColor = vec4(straight, 1.0); return; }

  // displacement from the baked map (RG = dome-warped disp, B = specular)
  vec2 lensUV = (px - (u_center - u_half)) / (2.0 * u_half);
  vec4 d = texture(u_map, lensUV);
  vec2 off = (d.rg - 0.5) * u_strength;

  // chroma-split sample, frosted toward the blurred copy inside the lens
  float blurMix = u_hasBlur * mask;
  vec2 uvR = toUV(px + off * (1.0 + u_chroma * 0.2));
  vec2 uvG = toUV(px + off * (1.0 + u_chroma * 0.1));
  vec2 uvB = toUV(px + off);
  vec3 col;
  col.r = mix(texture(u_src, uvR).r, sampleBlur(uvR).r, blurMix);
  col.g = mix(texture(u_src, uvG).g, sampleBlur(uvG).g, blurMix);
  col.b = mix(texture(u_src, uvB).b, sampleBlur(uvB).b, blurMix);

  // adaptive specular: add light on dark backdrops, darken on bright ones
  float spec = d.b - 0.502;
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  float darkBlend = smoothstep(min(u_specLo, u_specHi), max(u_specLo, u_specHi), luma);
  vec3 specAdd = col + spec * u_spec;
  vec3 specMul = col * (1.0 - spec * u_spec);
  col = max(mix(specAdd, specMul, darkBlend), 0.0);

  // adaptive brightness / vibrancy: pull toward mid-gray inside the lens
  col += (0.5 - luma) * u_vibrancy * mask;

  fragColor = vec4(mix(straight, col, mask), 1.0);
}`;function i(e,t,n){let r=e.createShader(t);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r);throw e.deleteShader(r),Error(`[GlassGL] shader compile failed:
`+t)}return r}function a(e,n){let r=e.createProgram();if(e.attachShader(r,i(e,e.VERTEX_SHADER,t)),e.attachShader(r,i(e,e.FRAGMENT_SHADER,n)),e.linkProgram(r),!e.getProgramParameter(r,e.LINK_STATUS))throw Error(`[GlassGL] link failed:
`+e.getProgramInfoLog(r));return r}function o(e){let t=e.createTexture();return e.bindTexture(e.TEXTURE_2D,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),t}var s=class{constructor(e,t){this.canvas=e,this.texSize=[1,1],this.cssW=0,this.cssH=0,this.blurDirty=!0,this.center=[200,200],this.half=[180,120],this.view=null,this.cfg=t;let i=e.getContext(`webgl2`,{premultipliedAlpha:!1,antialias:!1});if(!i)throw Error(`[GlassGL] WebGL2 unavailable`);this.gl=i,this.mainProg=a(i,r),this.blurProg=a(i,n);let s=i.createBuffer();i.bindBuffer(i.ARRAY_BUFFER,s),i.bufferData(i.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),i.STATIC_DRAW);for(let e of[this.mainProg,this.blurProg]){let t=i.getAttribLocation(e,`a_pos`);i.bindBuffer(i.ARRAY_BUFFER,s),i.enableVertexAttribArray(t),i.vertexAttribPointer(t,2,i.FLOAT,!1,0,0)}this.srcTex=o(i),this.mapTex=o(i),this.fboTex=[o(i),o(i)],this.fbo=[i.createFramebuffer(),i.createFramebuffer()]}setBackdrop(e,t,n){let r=this.gl;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,!1),r.bindTexture(r.TEXTURE_2D,this.srcTex),r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,e),this.texSize=[t,n];for(let e=0;e<2;e++)r.bindTexture(r.TEXTURE_2D,this.fboTex[e]),r.texImage2D(r.TEXTURE_2D,0,r.RGBA,t,n,0,r.RGBA,r.UNSIGNED_BYTE,null),r.bindFramebuffer(r.FRAMEBUFFER,this.fbo[e]),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,this.fboTex[e],0);r.bindFramebuffer(r.FRAMEBUFFER,null),this.blurDirty=!0}bakeMap(){let t=this.gl,n=Math.max(2,Math.round(this.half[0]*2)),r=Math.max(2,Math.round(this.half[1]*2)),i=e({width:n,height:r,radius:this.cfg.radius,depth:this.cfg.depth,profile:this.cfg.profile,dome:this.cfg.dome,edge:1,glow:.35,margin:0});t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.bindTexture(t.TEXTURE_2D,this.mapTex),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,i)}updateSource(e){let t=this.gl;t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.bindTexture(t.TEXTURE_2D,this.srcTex),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),this.blurDirty=!0}markBlurDirty(){this.blurDirty=!0}resize(){let e=Math.min(window.devicePixelRatio||1,2);this.cssW=this.canvas.clientWidth,this.cssH=this.canvas.clientHeight,this.canvas.width=Math.round(this.cssW*e),this.canvas.height=Math.round(this.cssH*e)}runBlur(){let e=this.gl,[t,n]=this.texSize,r=this.cfg.frost;e.useProgram(this.blurProg),e.viewport(0,0,t,n),e.activeTexture(e.TEXTURE0),e.uniform1i(e.getUniformLocation(this.blurProg,`u_source`),0);let i=e.getUniformLocation(this.blurProg,`u_premul`);e.bindFramebuffer(e.FRAMEBUFFER,this.fbo[0]),e.bindTexture(e.TEXTURE_2D,this.srcTex),e.uniform1f(i,1),e.uniform2f(e.getUniformLocation(this.blurProg,`u_dir`),r/t,0),e.drawArrays(e.TRIANGLES,0,3),e.bindFramebuffer(e.FRAMEBUFFER,this.fbo[1]),e.bindTexture(e.TEXTURE_2D,this.fboTex[0]),e.uniform1f(i,0),e.uniform2f(e.getUniformLocation(this.blurProg,`u_dir`),0,r/n),e.drawArrays(e.TRIANGLES,0,3),e.bindFramebuffer(e.FRAMEBUFFER,null),this.blurDirty=!1}render(){let e=this.gl;this.blurDirty&&this.runBlur();let{cssW:t,cssH:n}=this,[r,i]=this.texSize,a,o,s,c;if(this.view)({x:a,y:o,w:s,h:c}=this.view);else{let e=Math.max(t/r,n/i);s=r*e,c=i*e,a=(t-s)/2,o=(n-c)/2}let l=this.mainProg;e.useProgram(l),e.viewport(0,0,this.canvas.width,this.canvas.height),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.srcTex),e.uniform1i(e.getUniformLocation(l,`u_src`),0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.mapTex),e.uniform1i(e.getUniformLocation(l,`u_map`),1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,this.fboTex[1]),e.uniform1i(e.getUniformLocation(l,`u_blurred`),2);let u=t=>e.getUniformLocation(l,t);e.uniform2f(u(`u_res`),t,n),e.uniform2f(u(`u_texSize`),r,i),e.uniform2f(u(`u_coverA`),s/r,c/i),e.uniform2f(u(`u_coverB`),-a,-o),e.uniform2f(u(`u_center`),this.center[0],this.center[1]),e.uniform2f(u(`u_half`),this.half[0],this.half[1]),e.uniform1f(u(`u_radius`),this.cfg.radius),e.uniform1f(u(`u_strength`),this.cfg.strength),e.uniform1f(u(`u_chroma`),this.cfg.chroma),e.uniform1f(u(`u_hasBlur`),+(this.cfg.frost>0)),e.uniform1f(u(`u_spec`),this.cfg.spec),e.uniform1f(u(`u_vibrancy`),this.cfg.vibrancy),e.uniform1f(u(`u_specLo`),this.cfg.specLo),e.uniform1f(u(`u_specHi`),this.cfg.specHi),e.drawArrays(e.TRIANGLES,0,3)}};export{s as GlassGL};