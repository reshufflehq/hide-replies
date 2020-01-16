import React, { useEffect } from 'react';

import { useQueryParams, StringParam } from 'use-query-params';
import { useCookies } from 'react-cookie';

import { TwitterLogin } from './components/TwitterLogin';
import { StopHiding } from './components/StopHiding';

import './styles/App.css';

function App() {
  const [cookies, setCookie, rmCookie] = useCookies(['id', 'name']);
  const [query, setQuery] = useQueryParams({
    user_id: StringParam,
    name: StringParam,
  });

  // On the first update we want to trade possible query
  // params for equivalent cookies. This puts an inherent
  // time limit on the users auth
  useEffect(() => {
    const { user_id, name } = query;
    if (user_id && name) {
      const fifteenMin = new Date(new Date().getTime() + 15 * 60 * 1000);
      const cookOpts = { expires: fifteenMin };
      setCookie('name', name, cookOpts);
      setCookie('id', user_id, cookOpts);
      setQuery({
        user_id: undefined,
        name: undefined,
      });
    }
  }, [query, cookies, setCookie, setQuery]);

  const stopHiding = async () => {
    try {
      await fetch('/stop-hiding');
    } catch (err) {
      console.error(err);
    }
    rmCookie('name');
    rmCookie('id');
    rmCookie('request_token');
  };

  return (
    <div className='App'>
      {
        (!cookies.id || !cookies.name) ?
          <TwitterLogin/>
        :
          <StopHiding stopHidingHandler={stopHiding}/>
      }
    </div>
  );
}

export default App;
