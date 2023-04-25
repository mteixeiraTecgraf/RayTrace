import { vec2, vec3 } from "gl-matrix";

export const LIGHT_FACTOR = 1;
export const RESOLUTION = [600,400]
export const ANGLE = 30
export const SHINESS = 2;
export const SAMPLE_COUNT = 1;
export const RANDOM_SAMPLE = false ;
export const DEFAULT_AREA_SAMPLE_COUNT = 1 ;
export const LIMITS = [0.69,0.68, 0.15, 0.16];
export const FORCCE_HIT = false
export const FORCCE_HIT_ON_VERTEX = false
export const FORCCE_HIT_MAT_CODE = false
export const FORCCE_HIT_OCL_MAT_CODE = false
export const FORCE_HIDE_REFLECTION = false
export const FORCCE_NORMAL = false
export const FORCCE_L_HIT = false
export const FORCCE_L_HIT_N = false
export const FORCCE_LI_HIT = false
export const FORCCE_LI_MAT = false

export const TRACE_RAY_RECURSION_MAX = 7
export const TEST_BRUTE_FORCE = false;

export const DEBUG_TRACE_POINT = false;
export const DEBUG_TRACE_POINT_COORDS:vec3 = [1.5,1.2,2.97];
export const DEBUG_SAMPLE:vec2 = [0.0,0.0];//0.5875, 0.31875];
export const DEBUG_SAMPLE2:vec2 = [300,300];//0.5875, 0.31875];
export const DEBUG_SAMPLE2_RADIUS:vec2 = [10,10];//0.5875, 0.31875];

export const PONTUAL_LIGHT_RADIUS = 0.05;
export const REPEAT_PX = 1;