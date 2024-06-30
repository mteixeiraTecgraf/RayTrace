import { vec2, vec3 } from "gl-matrix";

export const FAST = true;
export const PERCENTUAL_STEP =  0.2;

export const LIGHT_FACTOR = 1;
export const AMBIENT_LIGHT = 0.0;
export const RESOLUTION = [300,300]
export const PATH_TRACE = true
export const PATH_PIPE = false
export const ANGLE = 108
export const CONFIG_NAME = "RUSS2"
export const SAVE_FILE = false
export const NUM_CICLES = 10;
export const CONFIG_HIGHLIGHT = true
export const SHINESS = 2;
export const SAMPLE_COUNT = FAST?1:64;
export const DFIX = -1;
export const DMAX = 4;
export const RANDOM_SAMPLE = true ;
export const DEFAULT_LIGHT_SAMPLE_COUNT = FAST?2:4 ;
export const DEFAULT_AREA_SAMPLE_COUNT = 1 ;
export const LIMITS = [0.69,0.68, 0.15, 0.16];
/**
 * Force a Simulation of A hit occurring
 */
export var FORCCE_HIT = false
/**
 * Force Interaction Hit Level
 */
export const FORCCE_HIT_LEVEL = -1
/**
 * Render the Miss direction when miss occurs
 */
export const FORCCE_MISS_DIRECTION = false
/**
 * Force a Ray Hit on Vertex to test hits
 */
export const FORCCE_HIT_ON_VERTEX = false

export const NO_BETA_DECAY = false
export var FORCCE_HIT_MAT_CODE = false
export var RENDER_PDF = false
export const RENDER_BETA_LEN = false
export const FORCE_END_COLORS = false
export const FORCCE_RAY_HIT_MAT_CODE = -1
export const IGNORE_MIRROR_BDRF = false
export const FORCE_MIRROR_BDRF = false
/**
 * Debug Test Context to monitor tests status
 */
export const DEBUG_CONTEXT = false
export const FORCCE_HIT_OCL_MAT_CODE = false
export const FORCE_HIDE_REFLECTION = false
export var FORCCE_NORMAL = false
export var FORCCE_L_HIT = false
export const FORCCE_L_HIT_N = false
export const FORCCE_LI_HIT = false
export const FORCCE_LI_MAT = false
export const FORCCE_WI_MAT = false
export const FORCCE_LIGHT_FACTOR = false

export const TRACE_RAY_RECURSION_MAX = 7
export const TEST_BRUTE_FORCE = false;

export const DEBUG_TRACE_POINT = false;
export const DEBUG_TRACE_POINT_COORDS:vec3 = [1.5,1.2,2.97];
export const DEBUG_SAMPLE:vec2 = [-0.90,0.45];//0.5875, 0.31875];
export const DEBUG_SAMPLE2:vec2 = [300,300];//0.5875, 0.31875];
export const DEBUG_SAMPLE2_RADIUS:vec2 = [10,10];//0.5875, 0.31875];
export const SAMPLE_DIST = 0.042;//0.5875, 0.31875];

export const PONTUAL_LIGHT_RADIUS = 0.05;
export const REPEAT_PX = 1;