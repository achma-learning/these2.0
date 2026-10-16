import Image from 'next/image';

type IconProps = {
  width: number;
  height: number;

}

const Facebook = ({ width = 24, height = 24 }:IconProps) => {
  return (
    <Image
    width={width}
    height={height}
    src={"/facebook.png"}
    alt='Facebook'
    
    />
  );
};

export default Facebook;
