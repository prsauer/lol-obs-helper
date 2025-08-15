import { useNavigate } from 'react-router-dom';

export const Button = (props: React.HTMLAttributes<HTMLButtonElement> & { linkTo?: string }) => {
  const nav = useNavigate();
  const { linkTo, ...others } = props;
  return (
    <button
      {...others}
      onClick={props.linkTo ? () => nav(linkTo as string) : props.onClick}
      className={
        'bg-transparent hover:text-[1.02em] hover:bg-primary-800 font-semibold py-1 px-7 border border-primary-200 hover:border-transparent rounded transition-all duration-150 line-height-tight ' +
        props.className
      }
    >
      {props.children}
    </button>
  );
};
