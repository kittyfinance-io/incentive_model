import { Stack, Slider, Typography, Input, Grid } from "@mui/material";
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

      <Grid container alignItems="center">

        <Grid item xs>

          <Slider
            value={value}
            step={stepValue}
            min={minValue}
            max={maxValue}
            valueLabelDisplay="on"
            onChange={(e, n) => setValue(n as number)}
            aria-labelledby="input-slider"
          />

        </Grid>

        <Grid item sx={{ ml: 1 }}>

          <Input
            value={value}
            //size="small"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setValue(event.target.value === '' ? 0 : Number(event.target.value));
            }}
            inputProps={{
              step: {stepValue},
              min: {minValue},
              max: {maxValue},
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
            sx={{
              width: 0.35
            }}
          />

        </Grid>

      </Grid>

    </Stack>
  );
};

export default InputSlider;
