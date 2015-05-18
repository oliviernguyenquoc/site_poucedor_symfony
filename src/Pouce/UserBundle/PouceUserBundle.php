<?php

namespace Pouce\UserBundle;

use Symfony\Component\HttpKernel\Bundle\Bundle;

class PouceUserBundle extends Bundle
{
  public function getParent()
  {
    return 'FOSUserBundle';
  }
}
