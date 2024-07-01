import * as yaml from 'js-yaml';

interface Config {
  scene_name: string;
  background_color: string;
  render_quality: string;
  resolution?: { W: number; H: number};
  render_hit:boolean;
  render_normal:boolean;
  render_L_Hit:boolean;
  render_Material_Color:boolean;
}

interface Material {
  TYPE: string;
  [key: string]: any;
}
interface Light {
  TYPE: string;
  [key: string]: any;
}

interface Shape {
  TYPE: string;
  [key: string]: any;
}

interface Transform {
  [key: string]: { x: number; y: number; z: number; } | number[];
}
interface CameraAction {
    [key: string]: any;
}

interface Camera {
    ACTIONS?: CameraAction[]
}
interface Entity {
  NAME: string;
  LIGHT?: Light;
  MATERIAL?: Material;
  SHAPE: Shape;
  TRANSFORMS: Transform[];
}

interface Scene {
  CAMERA?: Camera;
  entities: Entity[];
}

interface YamlContent {
  CONFIG: Config;
  SCENE: Scene;
}

export class YamlParser {
  static parseYaml(yamlString: string): YamlContent {
    try {
      const data = yaml.load(yamlString) as YamlContent;
      return data;
    } catch (e) {
      throw new Error(`Failed to parse YAML string: ${e}`);
    }
  }
}