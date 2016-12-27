const skyboxVertexShader =
`
    varying vec2 vUV;

    void main() {  
      vUV = uv;
      vec4 pos = vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * pos;
    }
`;

const skyboxFragmentShader =
`
    uniform sampler2D texture;
    varying vec2 vUV;

    void main() {  
      vec4 sample = texture2D(texture, vUV);
      gl_FragColor = vec4(sample.xyz, sample.w);
    }
`;

const skyboxFragmentShaderSymmetric =
`
    uniform sampler2D texture;
    varying vec2 vUV;

    void main() {
      vec2 vUVreflected = (vUV.y < 0.5)
        ? vec2(      vUV.x,  1.0 - (vUV.y * 2.0))
        : vec2(1.0 - vUV.x, -1.0 + (vUV.y * 2.0));
      vec4 sample = texture2D(texture, vUVreflected);
      gl_FragColor = vec4(sample.xyz, sample.w);
    }
`;

/* Reference: http://www.ianww.com/blog/2014/02/17/making-a-skydome-in-three-dot-js/ */
        
class Skydome {
    constructor(scene, renderer) {
        this.renderer = renderer;

        var geometry = new THREE.SphereGeometry(500, 60, 40);

        var uniforms = {
            texture: { type: 't', value: null }
        };

        this.material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            vertexShader:   skyboxVertexShader,
            fragmentShader: skyboxFragmentShader
        });

        this.skyBox = new THREE.Mesh(geometry, this.material);
        this.skyBox.scale.set(-1, 1, 1);
        this.skyBox.rotation.order = 'XZY';
        this.skyBox.renderDepth = 1000.0;
        scene.add(this.skyBox);
    }

    set image(imageName) {
        var texture = loader.load(imageName);
        texture.anisotropy = renderer.getMaxAnisotropy();
        this.material.uniforms.texture.value = texture;
    }
    
    set symmetric(symmetric) {
        this.material.fragmentShader = symmetric ? skyboxFragmentShaderSymmetric : skyboxFragmentShader;
    }
    
    animate() {
        this.skyBox.rotation.y += 0.00025;
    }
}
