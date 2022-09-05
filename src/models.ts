export type ParamValue = {
  name: string;
  value: number;
};

export type Param = {
  id: string;
  title: string;
  values: ParamValue[];
  defaultValue: number;
};
