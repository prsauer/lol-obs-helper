import { useNavigate } from 'react-router-dom';

export const Button = (props: React.HTMLAttributes<HTMLButtonElement> & { linkTo?: string }) => {
  const nav = useNavigate();
  const { linkTo, ...others } = props;
  return (
    <button
      {...others}
      onClick={props.linkTo ? () => nav(linkTo as string) : props.onClick}
      className={
        'bg-transparent hover:bg-green-500 text-green-700 font-semibold hover:text-white py-1 px-7 border border-green-500 hover:border-transparent rounded ' +
        props.className
      }
    >
      {props.children}
    </button>
  );
};
