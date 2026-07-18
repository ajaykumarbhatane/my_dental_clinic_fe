export const routeTo = (to, options = {}) => {
  const { replace = false } = options;

  if (typeof to === 'number') {
    window.history.go(to);
    return;
  }

  const target = typeof to === 'string' ? to : '/';

  if (replace) {
    window.history.replaceState({}, '', target);
  } else {
    window.history.pushState({}, '', target);
  }

  window.dispatchEvent(new PopStateEvent('popstate'));
};

export const goBack = () => {
  window.history.back();
};
