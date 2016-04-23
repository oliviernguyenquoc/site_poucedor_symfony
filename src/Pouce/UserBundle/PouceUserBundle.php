<?php

namespace Pouce\UserBundle;

use Pouce\UserBundle\DependencyInjection\Security\Factory\WsseFactory;
use Symfony\Component\HttpKernel\Bundle\Bundle;
use Symfony\Component\DependencyInjection\ContainerBuilder;

class PouceUserBundle extends Bundle
{
	public function getParent()
	{
		return 'FOSUserBundle';
	}
    public function build(ContainerBuilder $container)
    {
        parent::build($container);

        $extension = $container->getExtension('security');
        $extension->addSecurityListenerFactory(new WsseFactory());
    }
}
