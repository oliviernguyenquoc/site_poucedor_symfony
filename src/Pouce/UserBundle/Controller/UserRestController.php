<?php

namespace Pouce\UserBundle\Controller;

use FOS\RestBundle\Controller\Annotations\View;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

class UserRestController extends Controller
{
	public function getUserAction($first_name){
		$user = $this->getDoctrine()->getRepository('PouceUserBundle:User')->findOneBy(array('first_name' => $first_name));
		if(!is_object($user)){
			throw $this->createNotFoundException();
		}
		//exit(\Doctrine\Common\Util\Debug::dump($user));
		return $user;
	}
}
