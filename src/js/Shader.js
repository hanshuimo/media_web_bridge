module.exports = {
    video_fs: `
    uniform sampler2D map;
    varying vec2 vUv;

    void main() {
        vec4 color = texture2D( map, vUv );
        gl_FragColor = vec4( color.r, color.g, color.b, 0.2 );
    }
    `,
    video_vs: `
    uniform sampler2D map;

    uniform float width;
    uniform float height;
    uniform float nearClipping, farClipping;
    uniform float pointSize;
    uniform float zOffset;

    varying vec2 vUv;
    const float XtoZ = 1.11146; // tan( 1.0144686 / 2.0 ) * 2.0;
    const float YtoZ = 0.83359; // tan( 0.7898090 / 2.0 ) * 2.0;

    void main() {

        vUv = vec2( position.x / width, position.y / height );
        vec4 color = texture2D( map, vUv );
        float depth = ( color.r + color.g + color.b ) / 3.0;
        

        float z = ( 1.0 - depth ) * (farClipping - nearClipping) + nearClipping;
        vec4 pos = vec4(
            ( position.x / width - 0.5 ) * z * XtoZ,
            ( position.y / height - 0.5 ) * z * YtoZ,
            - z + zOffset,
            1.0);

        gl_PointSize = pointSize;
        gl_Position = projectionMatrix * modelViewMatrix * pos;

    }`,
    cloud_fs: `
    uniform sampler2D map;

    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float fogFar;

    varying vec2 vUv;
    void main() {
    
        float depth = gl_FragCoord.z / gl_FragCoord.w;
        float fogFactor = smoothstep( fogNear, fogFar, depth );
        gl_FragColor = texture2D( map, vUv );
        gl_FragColor.w *= pow( gl_FragCoord.z, 20.0 );
        gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
    
    }`,
    cloud_vs: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`
}