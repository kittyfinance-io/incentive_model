import { Stack, Slider, Typography } from "@mui/material";
import React from "react";

interface IProps {
  name: string;
  value?: number;
  maxValue?: number;
  minValue?: number;
  stepValue?: number;
  unitValue?: string;
  setValue: (arg: number) => void;
}

const InputSlider = ({
  name,
  value,
  maxValue,
  minValue,
  stepValue,
  unitValue,
  setValue,
}: IProps) => {
  return (
    <Stack spacing={5} direction="column" sx={{ mt: 3 }}>
      <Typography variant="h6">
        {name}: ({unitValue})
      </Typography>
      <Slider
        value={value}
        step={stepValue}
        min={minValue}
        max={maxValue}
        valueLabelDisplay="on"
        onChange={(e, n) => setValue(n as number)}
      />
    </Stack>
  );
};

export default InputSlider;
