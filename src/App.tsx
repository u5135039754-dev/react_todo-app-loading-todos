/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState } from 'react';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';
import { Todo } from './types/Todo';

import { useEffect } from 'react';
import { getTodos } from './api/todos';
import * as postService from './api/todos';

export const App: React.FC = () => {
  const [posts, setPosts] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const draft = { title: title.trim(), completed: false };
  const allCompleted = posts.length > 0 && posts.every(post => post.completed);
  const hasTodos = posts.length > 0;
  const anyCompleted = posts.some(post => post.completed);
  const hasPosts = posts.length > 0;
  const clearCompleted = () => {
    setPosts(posts.filter(post => !post.completed));
  };

  const isTitleEmpty = title.trim() === '';

  const [errorMessage, setErrorMessage] = useState('');

  const [deletingTodoId, setDeletingTodoId] = useState<number | null>(null);
  const onDelete = async (id: number) => {
    setDeletingTodoId(id);
    try {
      await postService.deletePost(id);
      setPosts(currentPosts => currentPosts.filter(post => post.id !== id));
    } catch (error) {
      setErrorMessage('Unable to delete todo');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setDeletingTodoId(null);
    }
  };

  useEffect(() => {
    if (!USER_ID) {
      return;
    }

    const delayTimer = setTimeout(() => setLoading(true), 500);

    setErrorMessage('');
    getTodos()
      .then(setPosts)
      .catch(() => setErrorMessage('Unable to load todos'))
      .finally(() => {
        clearTimeout(delayTimer);
        setTimeout(() => setLoading(false), 500);
      });
  }, []);

  const visibleTodos = posts.filter(todo => {
    if (filter === 'active') {
      return !todo.completed;
    }

    if (filter === 'completed') {
      return todo.completed;
    }

    return true;
  });

  function handleAddPost(event: React.FormEvent) {
    event.preventDefault();
    postService.createTodo(title, USER_ID);
    const value = title.trim();

    if (!value) {
      return;
    }

    setPosts(current => {
      const maxId = current.length ? Math.max(...current.map(p => p.id)) : 0;
      const newTodo = { ...draft, id: maxId + 1 };

      return [...current, newTodo];
    });
    setTitle('');
  }

  const [updatingIds, setUpdatingIds] = useState<number[]>([]);

  async function handleTodoStatus(id: number, checked: boolean) {
    setErrorMessage(''); // Hide previous notifications
    setUpdatingIds(prev => [...prev, id]); // Mark as updating
    try {
      const current = posts.find(post => post.id === id);

      if (!current) {
        return;
      }

      const payload = { ...current, completed: checked };
      const serverTodo = await postService.updateTodo(id, payload);

      setPosts(prev => prev.map(p => (p.id === id ? serverTodo : p)));
    } catch (error) {
      setErrorMessage('Unable to update todo');
    } finally {
      setUpdatingIds(prev => prev.filter(updatingId => updatingId !== id));
    }
  }

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {hasPosts ? (
            allCompleted ? (
              <button
                type="button"
                disabled={isTitleEmpty || loading}
                onClick={handleAddPost}
                className="todoapp__toggle-all"
                data-cy="ToggleAllButton"
              />
            ) : (
              <button
                type="button"
                disabled={isTitleEmpty || loading}
                onClick={handleAddPost}
                className="todoapp__toggle-all active"
                data-cy="ToggleAllButton"
              />
            )
          ) : null}

          <form onSubmit={handleAddPost}>
            <input
              data-cy="NewTodoField"
              type="text"
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {posts.map(post => (
            <>
              <div data-cy="Todo" className="todo">
                <label className="todo__status-label">
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                    onChange={event =>
                      handleTodoStatus(post.id, event.target.checked)
                    }
                    checked={post.completed}
                    disabled={updatingIds.includes(post.id)}
                  />
                </label>

                <span data-cy="TodoTitle" className="todo__title">
                  {post.title}
                </span>
                <ul>
                  {visibleTodos.map(todo => (
                    <li
                      key={todo.id}
                      className={`todo${todo.completed ? 'completed' : ''}`}
                    >
                      <button
                        type="button"
                        aria-label="Delete todo"
                        className="todo__remove"
                        data-cy="TodoDelete"
                        onClick={() => onDelete(todo.id)}
                        disabled={deletingTodoId === todo.id}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>

                {/* overlay will cover the todo while it is being deleted or updated */}
                <div data-cy="TodoLoader" className="modal overlay">
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>
            </>
          ))}
        </section>

        {hasTodos ? (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {posts.length} items left
            </span>

            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className="filter__link"
                onClick={event => {
                  event.preventDefault();
                  setFilter('all');
                }}
                data-cy="FilterLinkAll"
              >
                All
              </a>

              <a
                href="#/active"
                className="filter__link"
                data-cy="FilterLinkActive"
                onClick={event => {
                  event.preventDefault();
                  setFilter('active');
                }}
              >
                Active
              </a>

              <a
                href="#/completed"
                className="filter__link"
                data-cy="FilterLinkCompleted"
                onClick={event => {
                  event.preventDefault();
                  setFilter('completed');
                }}
              >
                Completed
              </a>
            </nav>

            {anyCompleted ? (
              <button
                type="button"
                className="todoapp__clear-completed"
                data-cy="ClearCompletedButton"
                onClick={clearCompleted}
                disabled={!anyCompleted}
              >
                Clear completed
              </button>
            ) : null}
          </footer>
        ) : null}
      </div>
      {!hasTodos && (
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
            className={errorMessage ? 'notification' : 'notification hidden'}
          >
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
};
