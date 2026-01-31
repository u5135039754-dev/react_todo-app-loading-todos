import { useEffect, useRef } from 'react';
import '../../styles/index.scss';
import { Todo } from '../../types/Todo';
import { getTodos, USER_ID } from '../../api/todos';

type Props = {
  posts: Todo[];
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setPosts: React.Dispatch<React.SetStateAction<Todo[]>>;
  errorMessage: string;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Index: React.FC<Props> = ({
  setPosts,
  setErrorMessage,
  errorMessage,
  setLoading,
}) => {
  const hideErrorTimer = useRef<number | null>(null);

  function showError(msg: string) {
    if (hideErrorTimer.current) {
      window.clearTimeout(hideErrorTimer.current);
    }

    setErrorMessage(msg);
    hideErrorTimer.current = window.setTimeout(() => setErrorMessage(''), 3000);
  }

  useEffect(() => {
    if (!USER_ID) {
      return;
    }

    const delayTimer = setTimeout(() => setLoading(true), 500);

    setErrorMessage('');
    getTodos()
      .then(setPosts)
      .catch(() => showError('Unable to load todos'))
      .finally(() => {
        clearTimeout(delayTimer);
        setTimeout(() => setLoading(false), 500);
      });

    return () => {
      clearTimeout(delayTimer);
      if (hideErrorTimer.current) {
        clearTimeout(hideErrorTimer.current);
      }
    };
  }, []);

  return (
    <div
      data-cy="ErrorNotification"
      className={`notification is-danger is-light has-text-weight-normal ${!errorMessage ? 'hidden' : ''}`}
    >
      <button
        data-cy="HideErrorButton"
        type="button"
        onClick={() => setErrorMessage('')}
        className="delete"
      />
      <div
        className={`notification is-danger is-light has-text-weight-normal ${errorMessage ? '' : 'hidden'}`}
      >
        {errorMessage}
      </div>
    </div>
  );
};
