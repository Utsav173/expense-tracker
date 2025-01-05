import { ScaleLoader } from 'react-spinners';

const Loader = () => {
  return (
    <div className='fixed inset-0 flex h-screen w-full items-center justify-center'>
      <ScaleLoader />
    </div>
  );
};

export default Loader;
