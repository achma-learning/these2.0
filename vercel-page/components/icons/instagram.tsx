import Image from 'next/image';

type IconProps = {
  width: number;
  height: number;

}

const Instagram = ({ width = 24, height = 24 }:IconProps) => {
  return (
    <Image
    width={width}
    height={height}
    src={"/instagram.png"}
    alt='Instagram'
    
    />
  );
};

export default Instagram;
