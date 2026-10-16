import { Composition } from "remotion";
import { WenmaiIntro } from "./WenmaiIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="WenmaiIntro"
      component={WenmaiIntro}
      durationInFrames={30 * 38}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};