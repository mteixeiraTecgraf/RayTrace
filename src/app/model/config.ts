import { vec2, vec3 } from "gl-matrix";


var FAST = true;
export const Config = {
    PERCENTUAL_STEP: 0.2,

    LIGHT_FACTOR: 1,
    AMBIENT_LIGHT: 0.0,
    RESOLUTION: [200, 200],
    PATH_TRACE: true,
    PATH_PIPE: false,
    ANGLE: 108,
    CONFIG_NAME: "RUSS2",
    SAVE_FILE: false,
    NUM_CICLES: 10,
    CONFIG_HIGHLIGHT: true,
    SHINESS: 2,
    SAMPLE_COUNT: FAST ? 1 : 64,
    DFIX: -1,
    DMAX: 4,
    RANDOM_SAMPLE: true,
    DEFAULT_LIGHT_SAMPLE_COUNT: FAST ? 2 : 4,
    DEFAULT_AREA_SAMPLE_COUNT: 1,
    LIMITS: [0.69, 0.68, 0.15, 0.16],
    /**
     * Force a Simulation of A hit occurring
     */
    FORCCE_HIT: false,
    /**
     * Force Interaction Hit Level
     */
    FORCCE_HIT_LEVEL: -1,
    /**
     * Render the Miss direction when miss occurs
     */
    FORCCE_MISS_DIRECTION: false,
    /**
     * Force a Ray Hit on Vertex to test hits
     */
    FORCCE_HIT_ON_VERTEX: false,

    NO_BETA_DECAY: false,
    FORCCE_HIT_MAT_CODE: false,
    RENDER_PDF: false,
    RENDER_BETA_LEN: false,
    FORCE_END_COLORS: false,
    FORCCE_RAY_HIT_MAT_CODE: -1,
    IGNORE_MIRROR_BDRF: false,
    FORCE_MIRROR_BDRF: false,
    /**
     * Debug Test Context to monitor tests status
     */
    DEBUG_CONTEXT: false,
    FORCCE_HIT_OCL_MAT_CODE: true,
    FORCE_HIDE_REFLECTION: false,
    FORCCE_NORMAL: false,
    FORCCE_L_HIT: false,
    FORCCE_L_HIT_N: false,
    FORCCE_LI_HIT: false,
    FORCCE_LI_MAT: false,
    FORCCE_WI_MAT: false,
    FORCCE_LIGHT_FACTOR: false,

    TRACE_RAY_RECURSION_MAX: 7,
    TEST_BRUTE_FORCE: false,

    DEBUG_TRACE_POINT: false,
    DEBUG_TRACE_POINT_COORDS: [1.5, 1.2, 2.97] as vec3,
    DEBUG_SAMPLE: [-0.90, 0.45] as vec2,//0.5875, 0.31875],
    DEBUG_SAMPLE2: [300, 300] as vec2,//0.5875, 0.31875],
    DEBUG_SAMPLE2_RADIUS: [10, 10] as vec2,//0.5875, 0.31875],
    SAMPLE_DIST: 0.042,//0.5875, 0.31875],

    PONTUAL_LIGHT_RADIUS: 0.05,
    REPEAT_PX: 1,
}