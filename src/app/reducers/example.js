import { handleActions } from 'redux-actions';

type State = {
  open: Boolean,
};

export function initState() {
  return { open: false };
}

const reducer = handleActions(
  {
    EXAMPLE_OPEN: (state: State, { payload }) => ({ ...state, open: true }),
    EXAMPLE_CLOSE: (state: State, { payload }) => ({ ...state, open: false }),
    EXAMPLE_TOGGLE: (state: State, { payload }) => ({
      ...state,
      open: !state.open,
    }),
  },
  initState()
);

export default reducer;
